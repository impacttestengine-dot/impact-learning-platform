import { API_BASE_URL } from "/js/api-config.js";

const form = document.getElementById("classForm");
const classList = document.getElementById("classList") || document.getElementById("classesList");
const formStatus = document.getElementById("formStatus") || document.getElementById("classStatus");

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

function durationToNumber(value){
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 45;
}

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
  const expectedDuration = durationToNumber(duration);

  try{
    await fetch(`${API_BASE_URL}/api/classes/${classId}/start`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });

    const startedAt = Date.now();
    const meetWindow = window.open(meetingLink, "_blank", "noopener,noreferrer");

    if(!meetWindow){
      alert("The class has been marked as started, but the browser blocked the Meet window. Please allow popups and click Start Class again.");
      return;
    }

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

        alert(endedEarly
          ? "Class ended early and has been logged for review."
          : "Class ended and has been logged successfully."
        );

        loadClasses();
      }
    }, 1500);

  }catch(error){
    console.error(error);
    alert("Could not start class tracking.");
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
      classList.innerHTML = `<div class="empty-state">${escapeHtml(data.message || "Could not load classes.")}</div>`;
      return;
    }

    const classes = data.classes || [];

    if(!classes.length){
      classList.innerHTML = `<div class="empty-state">No scheduled classes yet.</div>`;
      return;
    }

    classList.innerHTML = classes.map((item) => {
      const title = escapeHtml(item.classTitle || "Untitled Class");
      const learner = escapeHtml(item.learnerGroup || "Learner / group not set");
      const teacher = escapeHtml(item.teacher || "Teacher not assigned");
      const day = escapeHtml(item.classDay || "Day not set");
      const time = escapeHtml(item.time || "Time not set");
      const duration = escapeHtml(item.duration || "Duration not set");
      const status = escapeHtml(item.status || "Scheduled");
      const meetingLink = escapeHtml(item.meetingLink || "");

      return `
        <article class="record-item class-item">
          <div class="record-top">
            <div>
              <div class="record-name">${title}</div>
              <div class="record-meta">
                ${learner} · ${teacher}<br>
                ${day} at ${time} · ${duration}
              </div>
              <div class="class-actions">
                <button class="glass-btn small-btn" type="button" onclick="startClass('${item.id}', '${meetingLink}', '${duration}')">
                  Start Class
                </button>
              </div>
            </div>
            <span class="badge">${status}</span>
          </div>
        </article>
      `;
    }).join("");

  }catch(error){
    console.error(error);
    classList.innerHTML = `<div class="empty-state">Could not connect to backend.</div>`;
  }
}

if(form){
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const classData = getClassData();

    if(!classData.classTitle || !classData.learnerGroup || !classData.teacher){
      if(formStatus) formStatus.textContent = "Please enter class title, learner/group, and teacher.";
      return;
    }

    if(formStatus) formStatus.textContent = "Saving class...";

    try{
      const response = await fetch(`${API_BASE_URL}/api/classes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData)
      });

      const data = await response.json();

      if(!data.ok){
        if(formStatus) formStatus.textContent = data.message || "Could not save class.";
        return;
      }

      if(formStatus) formStatus.textContent = "Class saved.";
      form.reset();
      await loadClasses();

    }catch(error){
      console.error(error);
      if(formStatus) formStatus.textContent = "Could not connect to backend.";
    }
  });
}

loadClasses();
