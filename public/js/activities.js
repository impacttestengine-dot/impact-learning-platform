import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const STORAGE_KEYS = {
  folders: "impactActivityFolders",
  activities: "impactActivities"
};

let folders = [];
let activities = [];
let selectedFolderId = "all";
let fields = [];

const $ = (id) => document.getElementById(id);

function toast(message){
  const box = $("toast");
  if(!box) return;
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2200);
}

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function localRead(key){
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

function localWrite(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

function docDate(value){
  if(!value) return new Date().toLocaleString();
  if(value.toDate) return value.toDate().toLocaleString();
  if(value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
}

function fieldId(){
  return "field_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

async function loadFolders(){
  try{
    const snap = await getDocs(query(collection(db, "activityFolders"), orderBy("createdAt", "desc")));
    folders = [];
    snap.forEach((doc) => folders.push({ id: doc.id, ...doc.data() }));
    localWrite(STORAGE_KEYS.folders, folders);
  }catch(err){
    folders = localRead(STORAGE_KEYS.folders);
  }
}

async function loadActivities(){
  try{
    const snap = await getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc")));
    activities = [];
    snap.forEach((doc) => activities.push({ id: doc.id, ...doc.data() }));
    localWrite(STORAGE_KEYS.activities, activities);
  }catch(err){
    activities = localRead(STORAGE_KEYS.activities);
  }
}

function renderFolderOptions(){
  const select = $("activityFolder");
  select.innerHTML = `<option value="">Select Folder</option>` + folders.map(folder =>
    `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`
  ).join("");
}

function renderFolders(){
  $("folderCount").textContent = folders.length;

  const allCount = activities.length;
  $("folderList").innerHTML = `
    <button class="activity-folder ${selectedFolderId === "all" ? "active" : ""}" data-id="all" data-name="All Activities" type="button">
      <span class="folder-icon"></span>
      <div><strong>All Activities</strong><small>${allCount} activities</small></div>
    </button>
    ${folders.map(folder => {
      const count = activities.filter(item => item.folderId === folder.id).length;
      return `
        <button class="activity-folder ${selectedFolderId === folder.id ? "active" : ""}" data-id="${folder.id}" data-name="${escapeHtml(folder.name)}" type="button">
          <span class="folder-icon"></span>
          <div><strong>${escapeHtml(folder.name)}</strong><small>${count} activities</small></div>
        </button>
      `;
    }).join("")}
  `;

  document.querySelectorAll(".activity-folder").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedFolderId = btn.dataset.id;
      $("selectedFolderTitle").textContent = btn.dataset.name;
      renderFolders();
      renderActivities();
    });
  });

  renderFolderOptions();
}

function renderActivities(){
  const visible = selectedFolderId === "all"
    ? activities
    : activities.filter(item => item.folderId === selectedFolderId);

  $("activityCount").textContent = `${visible.length} ${visible.length === 1 ? "activity" : "activities"}`;

  if(!visible.length){
    $("activityList").innerHTML = `<div class="empty-state">No activity saved in this folder yet.</div>`;
    return;
  }

  $("activityList").innerHTML = visible.map(item => `
    <article class="activity-card">
      <div class="activity-card-top">
        <div>
          <p>${escapeHtml(item.type || "Activity")}</p>
          <h3>${escapeHtml(item.title || "Untitled Activity")}</h3>
        </div>
        <span class="status-pill">${escapeHtml(item.status || "Created")}</span>
      </div>
      <p class="activity-note">
        ${escapeHtml(item.level || "Level not set")} �
        ${escapeHtml(item.personnel || "personnel not set")} �
        ${escapeHtml(item.impactLearnersGroup || "impactLearners/group not set")} �
        ${item.fields?.length || 0} blocks
      </p>
      <p class="activity-note">${escapeHtml(item.instructions || "No instructions added.")}</p>
    </article>
  `).join("");
}

function renderTracker(){
  const created = activities.filter(a => a.status === "Created").length;
  const published = activities.filter(a => a.status === "Published").length;
  const completed = activities.filter(a => a.status === "Completed").length;

  $("createdCount").textContent = created;
  $("publishedCount").textContent = published;
  $("completedCount").textContent = completed;
  $("trackerCount").textContent = `${activities.length} records`;

  if(!activities.length){
    $("trackerList").innerHTML = `<div class="empty-state">No activity records yet.</div>`;
    return;
  }

  $("trackerList").innerHTML = activities.map(item => {
    const folder = folders.find(f => f.id === item.folderId);
    return `
      <article class="tracker-row">
        <div>
          <p>${escapeHtml(item.status || "Created")} � ${escapeHtml(item.type || "Activity")}</p>
          <h3>${escapeHtml(item.title || "Untitled Activity")}</h3>
          <small>${escapeHtml(folder?.name || "No folder")} � ${escapeHtml(item.level || "No level")}</small>
        </div>
        <div>
          <strong>${docDate(item.createdAt)}</strong>
          <small>Created timestamp</small>
        </div>
      </article>
    `;
  }).join("");
}

function renderCanvas(){
  const canvas = $("canvasList");

  if(!fields.length){
    canvas.innerHTML = `<div class="empty-state">Add blocks from the left to build the activity.</div>`;
    return;
  }

  canvas.innerHTML = fields.map((field, index) => `
    <article class="field-card" data-id="${field.id}">
      <div class="field-top">
        <strong>${index + 1}. ${escapeHtml(field.type)}</strong>
        <div class="field-actions">
          <button type="button" data-up="${field.id}">?</button>
          <button type="button" data-down="${field.id}">?</button>
          <button type="button" data-remove="${field.id}">Remove</button>
        </div>
      </div>
      <label>Question / Prompt
        <input data-field-label="${field.id}" type="text" value="${escapeHtml(field.label)}">
      </label>
      ${(field.type === "Multiple Choice" || field.type === "Checkboxes" || field.type === "Dropdown") ? `
        <label>Options
          <textarea data-field-options="${field.id}" rows="3">${escapeHtml((field.options || []).join("\n"))}</textarea>
        </label>
      ` : ""}
      <label>
        <select data-field-required="${field.id}">
          <option value="false" ${!field.required ? "selected" : ""}>Optional</option>
          <option value="true" ${field.required ? "selected" : ""}>Required</option>
        </select>
      </label>
    </article>
  `).join("");

  canvas.querySelectorAll("[data-field-label]").forEach(input => {
    input.addEventListener("input", () => {
      const field = fields.find(f => f.id === input.dataset.fieldLabel);
      if(field) field.label = input.value;
    });
  });

  canvas.querySelectorAll("[data-field-options]").forEach(input => {
    input.addEventListener("input", () => {
      const field = fields.find(f => f.id === input.dataset.fieldOptions);
      if(field) field.options = input.value.split("\n").map(v => v.trim()).filter(Boolean);
    });
  });

  canvas.querySelectorAll("[data-field-required]").forEach(input => {
    input.addEventListener("change", () => {
      const field = fields.find(f => f.id === input.dataset.fieldRequired);
      if(field) field.required = input.value === "true";
    });
  });

  canvas.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      fields = fields.filter(f => f.id !== btn.dataset.remove);
      renderCanvas();
    });
  });

  canvas.querySelectorAll("[data-up]").forEach(btn => {
    btn.addEventListener("click", () => moveField(btn.dataset.up, -1));
  });

  canvas.querySelectorAll("[data-down]").forEach(btn => {
    btn.addEventListener("click", () => moveField(btn.dataset.down, 1));
  });
}

function moveField(id, direction){
  const index = fields.findIndex(f => f.id === id);
  const next = index + direction;
  if(index < 0 || next < 0 || next >= fields.length) return;
  [fields[index], fields[next]] = [fields[next], fields[index]];
  renderCanvas();
}

function addField(type){
  fields.push({
    id: fieldId(),
    type,
    label: `${type} prompt`,
    required: false,
    options: type === "Multiple Choice" || type === "Checkboxes" || type === "Dropdown"
      ? ["Option 1", "Option 2"]
      : []
  });
  renderCanvas();
}

async function saveFolder(){
  const name = $("folderName").value.trim();
  if(!name){
    toast("Please enter a folder name.");
    return;
  }

  const payload = { name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  try{
    const ref = await addDoc(collection(db, "activityFolders"), {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    folders.unshift({ id: ref.id, ...payload });
  }catch(err){
    folders.unshift({ id: "local_" + Date.now(), ...payload });
  }

  localWrite(STORAGE_KEYS.folders, folders);
  $("folderName").value = "";
  closeModal("folderModal");
  renderFolders();
  toast("Folder saved.");
}

async function saveActivity(){
  const title = $("activityTitle").value.trim();
  const folderId = $("activityFolder").value;
  const level = $("activityLevel").value;

  if(!title || !folderId || !level){
    toast("Please add title, folder, and level.");
    return;
  }

  if(!fields.length){
    toast("Please add at least one form block.");
    return;
  }

  const payload = {
    type: "Activity Form",
    title,
    folderId,
    level,
    personnel: $("activitypersonnel").value.trim(),
    impactLearnersGroup: $("activityimpactLearners").value.trim(),
    status: $("activityStatus").value || "Created",
    instructions: $("activityInstructions").value.trim(),
    fields: JSON.parse(JSON.stringify(fields)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try{
    const ref = await addDoc(collection(db, "activities"), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    activities.unshift({ id: ref.id, ...payload });
  }catch(err){
    activities.unshift({ id: "local_" + Date.now(), ...payload });
  }

  localWrite(STORAGE_KEYS.activities, activities);
  clearBuilder();
  closeModal("builderModal");
  renderFolders();
  renderActivities();
  renderTracker();
  toast("Activity saved.");
}

function clearBuilder(){
  ["activityTitle","activitypersonnel","activityimpactLearners","activityInstructions"].forEach(id => $(id).value = "");
  $("activityFolder").value = "";
  $("activityLevel").value = "";
  $("activityStatus").value = "Created";
  fields = [];
  renderCanvas();
}

function openModal(id){ $(id).classList.remove("hidden"); }
function closeModal(id){ $(id).classList.add("hidden"); }

function bind(){
  $("backBtn").addEventListener("click", () => history.back());
  $("openFolderBtn").addEventListener("click", () => openModal("folderModal"));
  $("openBuilderBtn").addEventListener("click", () => openModal("builderModal"));
  $("openTrackerBtn").addEventListener("click", () => { renderTracker(); openModal("trackerModal"); });
  $("saveFolderBtn").addEventListener("click", saveFolder);
  $("saveActivityBtn").addEventListener("click", saveActivity);

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addField(btn.dataset.add));
  });
}

async function init(){
  bind();
  await loadFolders();
  await loadActivities();
  renderFolders();
  renderActivities();
  renderTracker();
  renderCanvas();
}

init();




