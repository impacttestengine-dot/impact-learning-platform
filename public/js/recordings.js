import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { db, storage } from "/js/firebase-app.js";

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
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function safePathPart(value){
  return String(value || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function renderFolders(){
  levelFolders.innerHTML = levels.map((level) => {
    const count = recordingsCache.filter((item) => item.level === level).length;
    const active = level === selectedLevel ? "active" : "";

    return `
      <button class="level-folder-card ${active}" type="button" data-level="${escapeHtml(level)}">
        <span class="folder-icon"></span>
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
      ? `<video controls src="${escapeHtml(item.downloadUrl)}"></video>`
      : isAudio
        ? `<audio controls src="${escapeHtml(item.downloadUrl)}"></audio>`
        : `<a class="start-class-button recording-link-button" href="${escapeHtml(item.downloadUrl)}" target="_blank" rel="noopener">Open File</a>`;

    return `
      <article class="recording-media-card">
        <div class="recording-media-preview">${media}</div>

        <div class="recording-media-body">
          <p class="class-card-label">Class Recording</p>
          <h3>${escapeHtml(item.title || item.fileName || "Untitled Recording")}</h3>

          <div class="class-detail-grid recording-mini-grid">
            <div><span>impactLearners / Group</span><strong>${escapeHtml(item.impactLearnersGroup || "Not set")}</strong></div>
            <div><span>personnel</span><strong>${escapeHtml(item.personnel || "Not set")}</strong></div>
            <div><span>File Type</span><strong>${escapeHtml(item.fileType || "Not set")}</strong></div>
            <div><span>Level Folder</span><strong>${escapeHtml(item.level || "Not set")}</strong></div>
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
    const q = query(collection(db, "recordings"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    recordingsCache = [];
    snapshot.forEach((docSnap) => {
      recordingsCache.push({ id:docSnap.id, ...docSnap.data() });
    });

    renderFolders();
    renderRecordings();

  }catch(error){
    console.error(error);
    recordingList.innerHTML = `<div class="empty-state">Could not load recordings from Firestore.</div>`;
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = document.getElementById("recordingFile")?.files?.[0];

  if(!file){
    notify("Please choose a video or audio file.", "error");
    return;
  }

  const level = selectedLevel;
  const title = value("title") || file.name;
  const impactLearnersGroup = value("impactLearnersGroup");
  const personnel = value("personnel");
  const notes = value("notes");
  const fileType = file.type || "application/octet-stream";
  const fileName = file.name;
  const filePath = `recordings/${safePathPart(level)}/${Date.now()}-${safePathPart(fileName)}`;

  try{
    notify("Uploading recording...");

    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType:fileType
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        notify(`Uploading recording... ${progress}%`);
      },
      (error) => {
        console.error(error);
        notify("Could not upload recording to Firebase Storage.", "error");
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(collection(db, "recordings"), {
          title,
          level,
          personnel,
          impactLearnersGroup,
          notes,
          fileName,
          fileType,
          filePath,
          downloadUrl,
          status:"Uploaded",
          createdAt:serverTimestamp(),
          updatedAt:serverTimestamp()
        });

        notify("Recording uploaded.");
        form.reset();
        levelInput.value = selectedLevel;
        await loadRecordings();
      }
    );

  }catch(error){
    console.error(error);
    notify("Could not upload recording.", "error");
  }
});

levelInput.value = selectedLevel;
selectedLevelTitle.textContent = selectedLevel;
renderFolders();
loadRecordings();




