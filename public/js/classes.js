import { API_BASE_URL } from "/js/api-config.js";

const form = document.getElementById("classForm");
const classList = document.getElementById("classList") || document.getElementById("classesList");
const classCount = document.getElementById("classCount");
const roomSelect = document.getElementById("meetingLink");

let classesCache = [];

const meetRoomNames = {
  "https://meet.google.com/ukw-macm-cvo": "Impact Meet Room 1",
  "https://meet.google.com/fxh-gazg-jpp": "Impact Meet Room 2",
  "https://meet.google.com/rps-qrqe-upw": "Impact Meet Room 3",
  "https://meet.google.com/mea-ihvu-jhi": "Impact Meet Room 4"
};

function notify(message, type = "success"){
  let toast = document.getElementById("impactToast");

  if(!toast){
    toast = document.createElement("div");
    toast.id = "impactToast";
    toast.className = "impact-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `impact-toast show ${type}`;

  setTimeout(() => {
    toast.className = "impact-toast";
  }, 2600);
}

function value(id){
  return (document.getElementById(id)?.value || "").trim();
}

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function minutesFromTime(timeValue){
  const parts = String(timeValue || "").split(":");
  if(parts.length < 2) return null;
  return (Number(parts[0]) * 60) + Number(parts[1]);
}

function durationMinutes(value){
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 60;
}

function overlaps(startA, durationA, startB, durationB){
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && startB < endA;
}

function getMeetRoomName(link){
  return meetRoomNames[link] || "Selected Meet Room";
}

function updateRoomAvailability(){
  if(!roomSelect) return;

  const selectedDay = value("classDay");
  const selectedTime = value("time");
  const selectedDuration = value("duration");
  const newStart = minutesFromTime(selectedTime);
  const newDuration = durationMinutes(selectedDuration);

  Array.from(roomSelect.options).forEach((option) => {
    if(!option.value) return;

    const originalName = meetRoomNames[option.value] || option.textContent.replace(" — room unavailable at this period", "");

    option.disabled = false;
    option.textContent = originalName;

    if(!selectedDay || newStart === null) return;

    const unavailable = classesCache.some((item) => {
      const status = item.status || "Scheduled";
      if(!["Scheduled", "In Progress"].includes(status)) return false;
      if(item.classDay !== selectedDay) return false;
      if(item.meetingLink !== option.value) return false;

      const existingStart = minutesFromTime(item.time);
      const existingDuration = durationMinutes(item.duration);

      if(existingStart === null) return false;

      return overlaps(newStart, newDuration, existingStart, existingDuration);
    });

    if(unavailable){
      option.disabled = true;
      option.textContent = `${originalName} — room unavailable at this period`;
    }
  });

  if(roomSelect.selectedOptions[0]?.disabled){
    roomSelect.value = "";
  }
}

["classDay", "time", "duration"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", updateRoomAvailability);
  document.getElementById(id)?.addEventListener("input", updateRoomAvailability);
});

function getClassData(){
  return {
    classTitle: value("classTitle"),
    learnerGroup: value("learnerGroup"),
    teacher: value("teacher"),
    classDay: value("classDay"),
    time: value("time"),
    duration: value("duration"),
    meetingLink: value("meetingLink"),
    status: value("status") || "Scheduled",
    notes: value("notes")
  };
}

async function startClass(classId, meetingLink, duration){
  if(!meetingLink){
    notify("No Google Meet room is attached to this class.", "error");
    return;
  }

  const expectedDuration = durationMinutes(duration);

  try{
    await fetch(`${API_BASE_URL}/api/classes/${classId}/start`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });

    const startedAt = Date.now();
    const meetWindow = window.open(meetingLink, "_blank");

    if(!meetWindow){
      notify("Popup blocked. Please allow popups and start again.", "error");
      await loadClasses();
      return;
    }

    notify("Class started. Tracking has begun.");

    const tracker = setInterval(async () => {
      if(meetWindow.closed){
        clearInterval(tracker);

        const endedAt = Date.now();
        const actualMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
        const earlyThreshold = Math.max(10, Math.round(expectedDuration * 0.75));
        const endedEarly = actualMinutes < earlyThreshold;

        await fetch(`${API_BASE_URL}/api/classes/${classId}/end`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: endedEarly ? "Needs Review" : "Completed",
            actualDurationMinutes: String(actualMinutes),
            reviewReason: endedEarly ? "Class ended earlier than expected. Teacher review required." : ""
          })
        });

        notify(endedEarly ? "Class ended early and has been logged for review." : "Class ended and has been logged.");
        await loadClasses();
      }
    }, 1500);

    await loadClasses();

  }catch(error){
    console.error(error);
    notify("Could not start class tracking.", "error");
  }
}

window.startClass = startClass;

async function loadClasses(){
  if(!classList) return;

  classList.innerHTML = `<div class="empty-state">Loading classes...</div>`;

  try{
    const response = await fetch(`${API_BASE_URL}/api/classes`);
    const data = await response.json();

    if(!data.ok){
      if(classCount) classCount.textContent = "0 classes";
      classList.innerHTML = `<div class="empty-state">Could not load classes.</div>`;
      return;
    }

    classesCache = data.classes || [];
    updateRoomAvailability();

    const classes = classesCache.filter((item) => {
      const title = String(item.classTitle || "").trim();
      const learner = String(item.learnerGroup || "").trim();
      const teacher = String(item.teacher || "").trim();

      if(!title || !learner || !teacher) return false;
      return ["Scheduled", "In Progress"].includes(item.status || "Scheduled");
    });

    if(classCount){
      classCount.textContent = `${classes.length} ${classes.length === 1 ? "class" : "classes"}`;
    }

    if(!classes.length){
      classList.innerHTML = `<div class="empty-state">No class scheduled.</div>`;
      return;
    }

    classList.innerHTML = classes.map((item) => {
      const title = escapeHtml(item.classTitle);
      const learner = escapeHtml(item.learnerGroup);
      const teacher = escapeHtml(item.teacher);
      const day = escapeHtml(item.classDay || "Day not set");
      const time = escapeHtml(item.time || "Time not set");
      const duration = escapeHtml(item.duration || "Duration not set");
      const status = escapeHtml(item.status || "Scheduled");
      const meetingLink = escapeHtml(item.meetingLink || "");
      const roomName = escapeHtml(getMeetRoomName(item.meetingLink || ""));

      return `
        <article class="class-card-clean">
          <div class="class-card-head">
            <div>
              <p class="class-card-label">Level</p>
              <h3>${title}</h3>
            </div>
            <span class="class-status-pill">${status}</span>
          </div>

          <div class="class-detail-grid">
            <div>
              <span>Learner / Group</span>
              <strong>${learner}</strong>
            </div>
            <div>
              <span>Teacher</span>
              <strong>${teacher}</strong>
            </div>
            <div>
              <span>Day</span>
              <strong>${day}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>${time}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>${duration}</strong>
            </div>
            <div>
              <span>Google Meet Room</span>
              <strong>${roomName}</strong>
            </div>
          </div>

          <button class="start-class-button" type="button" onclick="startClass('${item.id}', '${meetingLink}', '${duration}')">
            Start Class
          </button>
        </article>
      `;
    }).join("");

  }catch(error){
    console.error(error);
    if(classCount) classCount.textContent = "0 classes";
    classList.innerHTML = `<div class="empty-state">Could not connect to backend.</div>`;
  }
}

if(form){
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const classData = getClassData();

    if(!classData.classTitle || !classData.learnerGroup || !classData.teacher){
      notify("Please enter level, learner/group, and teacher.", "error");
      return;
    }

    if(!classData.meetingLink){
      notify("Please select a Google Meet room.", "error");
      return;
    }

    try{
      const response = await fetch(`${API_BASE_URL}/api/classes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData)
      });

      const data = await response.json();

      if(!data.ok){
        notify(data.message || "Could not save class.", "error");
        return;
      }

      notify("Class saved.");
      form.reset();
      await loadClasses();

    }catch(error){
      console.error(error);
      notify("Could not connect to backend.", "error");
    }
  });
}

loadClasses();
