import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { db, storage } from "/js/firebase-app.js";

const MAIN_FOLDERS = [
  "Class Recordings",
  "Assessment Recordings",
  "Placement Chat Recordings",
  "Meeting Recordings",
  "Other Recordings"
];

let folders = [];
let recordings = [];
let activeMainFolder = MAIN_FOLDERS[0];
let activeSubFolderId = "";
let selectedFile = null;

const $ = (id) => document.getElementById(id);

function slug(value){
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}

function toast(message){
  const box = $("toast");
  if(!box) return;
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2300);
}

function clean(value){
  return String(value || "").trim();
}

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function loadFolders(){
  try{
    const snap = await getDocs(query(collection(db,"recordingFolders"), orderBy("createdAt","asc")));
    folders = [];
    snap.forEach(doc => folders.push({ id: doc.id, ...doc.data() }));
  }catch(e){
    folders = JSON.parse(localStorage.getItem("recordingFolders") || "[]");
  }
}

async function loadRecordings(){
  try{
    const snap = await getDocs(query(collection(db,"recordings"), orderBy("createdAt","desc")));
    recordings = [];
    snap.forEach(doc => recordings.push({ id: doc.id, ...doc.data() }));
  }catch(e){
    recordings = JSON.parse(localStorage.getItem("recordings") || "[]");
  }
}

async function saveFolder(mainFolder, name){
  const payload = {
    mainFolder,
    name,
    createdAt: new Date().toISOString()
  };

  try{
    const refDoc = await addDoc(collection(db,"recordingFolders"), {
      mainFolder,
      name,
      createdAt: serverTimestamp()
    });
    folders.push({ id: refDoc.id, ...payload });
  }catch(e){
    folders.push({ id: "local-" + Date.now(), ...payload });
    localStorage.setItem("recordingFolders", JSON.stringify(folders));
  }

  renderFolders();
  renderFolderSelect();
}

async function renameFolder(folderId){
  const folder = folders.find(f => f.id === folderId);
  if(!folder) return;

  const newName = prompt("Rename folder", folder.name);
  if(!clean(newName)) return;

  folder.name = clean(newName);
  localStorage.setItem("recordingFolders", JSON.stringify(folders));

  toast("Folder renamed locally. Firestore rename update can be added next.");
  renderFolders();
  renderFolderSelect();
}

function getSubfolders(mainFolder){
  return folders.filter(f => f.mainFolder === mainFolder);
}

function renderFolders(){
  $("folderList").innerHTML = MAIN_FOLDERS.map(main => {
    const subs = getSubfolders(main);
    const isOpen = activeMainFolder === main;

    return `
      <article class="folder-card ${isOpen ? "open" : ""}">
        <button class="folder-main" data-main="${escapeHtml(main)}" type="button">
          <span>
            <strong>${escapeHtml(main)}</strong>
            <small>${subs.length} subfolder${subs.length === 1 ? "" : "s"}</small>
          </span>
          <span class="folder-tools">
            <span class="icon-btn">⌄</span>
          </span>
        </button>

        <div class="subfolders">
          ${
            subs.length
              ? subs.map(sub => `
                <div class="subfolder ${activeSubFolderId === sub.id ? "active" : ""}" data-sub="${sub.id}">
                  <span class="subfolder-name">${escapeHtml(sub.name)}</span>
                  <button class="icon-btn" data-rename="${sub.id}" type="button">✎</button>
                </div>
              `).join("")
              : `<button class="empty-folder" data-create="${escapeHtml(main)}" type="button">+ Create first subfolder</button>`
          }

          ${
            subs.length
              ? `<button class="empty-folder" data-create="${escapeHtml(main)}" type="button">+ Create new subfolder</button>`
              : ""
          }
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-main]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeMainFolder = btn.dataset.main;
      renderFolders();
      renderRecordings();
    });
  });

  document.querySelectorAll("[data-create]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const name = prompt("New folder name");
      if(!clean(name)) return;
      await saveFolder(btn.dataset.create, clean(name));
      toast("Folder created.");
    });
  });

  document.querySelectorAll("[data-sub]").forEach(row => {
    row.addEventListener("click", () => {
      activeSubFolderId = row.dataset.sub;
      renderFolders();
      renderFolderSelect();
      renderRecordings();
    });
  });

  document.querySelectorAll("[data-rename]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      renameFolder(btn.dataset.rename);
    });
  });
}

function renderFolderSelect(){
  const options = folders.map(f => {
    const label = `${f.mainFolder} / ${f.name}`;
    return `<option value="${f.id}" ${activeSubFolderId === f.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");

  $("folderSelect").innerHTML = options || `<option value="">Create a folder first</option>`;

  if(activeSubFolderId){
    $("folderSelect").value = activeSubFolderId;
  }
}

function renderRecordings(){
  const visible = recordings.filter(r => {
    if(activeSubFolderId) return r.folderId === activeSubFolderId;
    return r.mainFolder === activeMainFolder;
  });

  if(!visible.length){
    $("recordingList").innerHTML = `<div class="recording-item"><p>No recording uploaded in this folder yet.</p></div>`;
    return;
  }

  $("recordingList").innerHTML = visible.map(item => `
    <article class="recording-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.uploader)} · ${escapeHtml(item.fileType)} · ${escapeHtml(item.folderName || item.mainFolder)}</p>
      <a href="${escapeHtml(item.downloadURL)}" target="_blank" rel="noopener">Open Recording</a>
    </article>
  `).join("");
}

async function prepareFile(file){
  $("uploadStatus").textContent = "Preparing upload...";

  // Browser-side real media compression is limited without heavy codecs.
  // This keeps uploads stable now and leaves room for later backend compression.
  return file;
}

async function uploadRecording(){
  const title = clean($("recordingTitle").value);
  const uploader = clean($("recordingUploader").value);
  const folderId = $("folderSelect").value;

  if(!title || !uploader || !folderId || !selectedFile){
    toast("Please add title, uploader, folder, and file.");
    return;
  }

  const folder = folders.find(f => f.id === folderId);
  if(!folder){
    toast("Please select a valid folder.");
    return;
  }

  try{
    $("uploadStatus").textContent = "Compressing/preparing file...";
    const finalFile = await prepareFile(selectedFile);

    $("uploadStatus").textContent = "Uploading recording...";
    const path = `recordings/${slug(folder.mainFolder)}/${slug(folder.name)}/${Date.now()}-${finalFile.name}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, finalFile);
    const downloadURL = await getDownloadURL(storageRef);

    const payload = {
      title,
      uploader,
      mainFolder: folder.mainFolder,
      folderId,
      folderName: folder.name,
      fileType: finalFile.type || "media",
      fileName: finalFile.name,
      filePath: path,
      downloadURL,
      createdAt: new Date().toISOString()
    };

    try{
      const docRef = await addDoc(collection(db,"recordings"), {
        ...payload,
        createdAt: serverTimestamp()
      });
      recordings.unshift({ id: docRef.id, ...payload });
    }catch(e){
      recordings.unshift({ id:"local-" + Date.now(), ...payload });
      localStorage.setItem("recordings", JSON.stringify(recordings));
    }

    $("recordingTitle").value = "";
    $("recordingUploader").value = "";
    $("recordingFile").value = "";
    selectedFile = null;
    $("fileName").textContent = "Choose an audio or video file to upload.";
    $("uploadStatus").textContent = "Upload complete.";
    toast("Recording uploaded.");
    renderRecordings();

  }catch(error){
    console.error(error);
    $("uploadStatus").textContent = "Could not upload recording. Check Firebase Storage rules and connection.";
  }
}

function bind(){
  $("fileDrop").addEventListener("click", () => $("recordingFile").click());

  $("recordingFile").addEventListener("change", () => {
    selectedFile = $("recordingFile").files[0] || null;
    $("fileName").textContent = selectedFile ? selectedFile.name : "Choose an audio or video file to upload.";
  });

  $("uploadBtn").addEventListener("click", uploadRecording);

  $("folderSelect").addEventListener("change", () => {
    activeSubFolderId = $("folderSelect").value;
    renderFolders();
    renderRecordings();
  });
}

async function init(){
  bind();
  await loadFolders();

  if(!folders.length){
    // Keep main folders clean. Do not auto-create subfolders.
    localStorage.setItem("recordingFolders", JSON.stringify([]));
  }

  await loadRecordings();
  renderFolders();
  renderFolderSelect();
  renderRecordings();
}

init();
