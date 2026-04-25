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
                ${day} at ${time} · ${duration}<br>
                ${meetingLink ? `<a href="${meetingLink}" target="_blank" rel="noopener">Open Class Link</a>` : "No meeting link"}
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
        headers: {
          "Content-Type": "application/json"
        },
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
