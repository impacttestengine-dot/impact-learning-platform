import { API_BASE_URL } from "/js/api-config.js";

const levels = [
  "Absolute Beginner",
  "A0",
  "A1",
  "A1.1",
  "A2",
  "B1",
  "B2"
];

const levelFolders = document.getElementById("levelFolders");
const selectedLevelTitle = document.getElementById("selectedLevelTitle");
const levelInput = document.getElementById("level");
const form = document.getElementById("recordingForm");
const recordingList = document.getElementById("recordingList");
const recordingCount = document.getElementById("recordingCount");

let selectedLevel = "Absolute Beginner";
let recordingsCache = [];

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

function renderFolders(){
  levelFolders.innerHTML = levels.map((level) => {
    const count = recordingsCache.filter((item) => item.level === level).length;
    const active = level === selectedLevel ? "active" : "";

    return `
      <button class="level-folder-card ${active}" type="button" data-level="${escapeHtml(level)}">
        <span class="folder-icon">▰</span>
        <strong>${escapeHtml(level)}</strong>
        <small>${count} ${count === 1 ? "recording" : "recordings"}</small>
      </button>
    `;
  }).join("");

  levelFolders.querySelectorAll(".level-folder-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLevel = button.dataset.level;
      levelInput.value = selectedLevel;
      selectedLevelTitle.textContent = selectedLevel;
      renderFolders();
      renderRecordings();
    });
  });
}

function renderRecordings(){
  const recordings = recordingsCache.filter((item) => item.level === selectedLevel);

  if(recordingCount){
    recordingCount.textContent = `${recordings.length} ${recordings.length === 1 ? "recording" : "recordings"}`;
  }

  if(!recordings.length){
    recordingList.innerHTML = `<div class="empty-state">No recording uploaded in this folder yet.</div>`;
    return;
  }

  recordingList.innerHTML = recordings.map((item) => {
    const isVideo = String(item.fileType || "").startsWith("video/");
    const isAudio = String(item.fileType || "").startsWith("audio/");
    const media = isVideo
      ? `<video controls src="${escapeHtml(item.publicUrl)}"></video>`
      : isAudio
        ? `<audio controls src="${escapeHtml(item.publicUrl)}"></audio>`
        : `<a class="start-class-button recording-link-button" href="${escapeHtml(item.publicUrl)}" target="_blank" rel="noopener">Open File</a>`;

    return `
      <article class="recording-media-card">
        <div class="recording-media-preview">
          ${media}
        </div>

        <div class="recording-media-body">
          <p class="class-card-label">Class Recording</p>
          <h3>${escapeHtml(item.title || item.fileName || "Untitled Recording")}</h3>

          <div class="class-detail-grid recording-mini-grid">
            <div>
              <span>Learner / Group</span>
              <strong>${escapeHtml(item.learnerGroup || "Not set")}</strong>
            </div>
            <div>
              <span>Teacher</span>
              <strong>${escapeHtml(item.teacher || "Not set")}</strong>
            </div>
          </div>

          ${item.notes ? `<p class="recording-note-text">${escapeHtml(item.notes)}</p>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function loadRecordings(){
  recordingList.innerHTML = `<div class="empty-state">Loading recordings...</div>`;

  try{
    const response = await fetch(`${API_BASE_URL}/api/recordings`);
    const data = await response.json();

    if(!data.ok){
      recordingList.innerHTML = `<div class="empty-state">Could not load recordings.</div>`;
      return;
    }

    recordingsCache = data.recordings || [];
    renderFolders();
    renderRecordings();

  }catch(error){
    console.error(error);
    recordingList.innerHTML = `<div class="empty-state">Could not connect to backend.</div>`;
  }
}

if(form){
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("recordingFile")?.files?.[0];

    if(!file){
      notify("Please choose a video or audio file.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("level", selectedLevel);
    formData.append("title", value("title") || file.name);
    formData.append("learnerGroup", value("learnerGroup"));
    formData.append("teacher", value("teacher"));
    formData.append("notes", value("notes"));
    formData.append("recording", file);

    notify("Uploading recording... please wait.");

    try{
      const response = await fetch(`${API_BASE_URL}/api/recordings/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if(!data.ok){
        notify(data.message || "Could not upload recording.", "error");
        return;
      }

      notify("Recording uploaded.");
      form.reset();
      levelInput.value = selectedLevel;
      await loadRecordings();

    }catch(error){
      console.error(error);
      notify("Could not connect to backend.", "error");
    }
  });
}

levelInput.value = selectedLevel;
selectedLevelTitle.textContent = selectedLevel;
renderFolders();
loadRecordings();
