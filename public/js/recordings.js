import { API_BASE_URL } from "/js/api-config.js";

const form = document.getElementById("recordingForm");
const recordingList = document.getElementById("recordingList");
const recordingCount = document.getElementById("recordingCount");

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

function getRecordingData(){
  return {
    level: value("level"),
    learnerGroup: value("learnerGroup"),
    teacher: value("teacher"),
    classDay: value("classDay"),
    classDate: value("classDate"),
    recordingLink: value("recordingLink"),
    notes: value("notes"),
    status: value("status") || "Saved"
  };
}

async function loadRecordings(){
  if(!recordingList) return;

  recordingList.innerHTML = `<div class="empty-state">Loading recordings...</div>`;

  try{
    const response = await fetch(`${API_BASE_URL}/api/recordings`);
    const data = await response.json();

    if(!data.ok){
      recordingList.innerHTML = `<div class="empty-state">Could not load recordings.</div>`;
      if(recordingCount) recordingCount.textContent = "0 recordings";
      return;
    }

    const recordings = data.recordings || [];

    if(recordingCount){
      recordingCount.textContent = `${recordings.length} ${recordings.length === 1 ? "recording" : "recordings"}`;
    }

    if(!recordings.length){
      recordingList.innerHTML = `<div class="empty-state">No recording saved yet.</div>`;
      return;
    }

    recordingList.innerHTML = recordings.map((item) => {
      const level = escapeHtml(item.level || "Level not set");
      const learner = escapeHtml(item.learnerGroup || "Learner / group not set");
      const teacher = escapeHtml(item.teacher || "Teacher not set");
      const day = escapeHtml(item.classDay || "Day not set");
      const date = escapeHtml(item.classDate || "Date not set");
      const status = escapeHtml(item.status || "Saved");
      const notes = escapeHtml(item.notes || "No notes added");
      const link = escapeHtml(item.recordingLink || "");

      return `
        <article class="class-card-clean">
          <div class="class-card-head">
            <div>
              <p class="class-card-label">Recording</p>
              <h3>${level}</h3>
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
              <span>Date</span>
              <strong>${date}</strong>
            </div>
          </div>

          <div class="recording-notes">
            <span>Notes</span>
            <p>${notes}</p>
          </div>

          ${link ? `<a class="start-class-button recording-link-button" href="${link}" target="_blank" rel="noopener">Open Recording</a>` : ""}
        </article>
      `;
    }).join("");

  }catch(error){
    console.error(error);
    if(recordingCount) recordingCount.textContent = "0 recordings";
    recordingList.innerHTML = `<div class="empty-state">Could not connect to backend.</div>`;
  }
}

if(form){
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const recordingData = getRecordingData();

    if(!recordingData.level || !recordingData.learnerGroup || !recordingData.teacher || !recordingData.recordingLink){
      notify("Please enter level, learner/group, teacher, and recording link.", "error");
      return;
    }

    try{
      const response = await fetch(`${API_BASE_URL}/api/recordings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(recordingData)
      });

      const data = await response.json();

      if(!data.ok){
        notify(data.message || "Could not save recording.", "error");
        return;
      }

      notify("Recording saved.");
      form.reset();
      await loadRecordings();

    }catch(error){
      console.error(error);
      notify("Could not connect to backend.", "error");
    }
  });
}

loadRecordings();
