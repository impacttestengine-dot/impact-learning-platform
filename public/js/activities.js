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

let folders = [];
let activities = [];
let questions = [];
let selectedFolderId = "all";

const $ = (id) => document.getElementById(id);

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

function uid(){
  return "q-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function slug(value){
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}

function toast(message){
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2300);
}

function openModal(id){ $(id).classList.remove("hidden"); }
function closeModal(id){ $(id).classList.add("hidden"); }

async function loadFolders(){
  try{
    const snap = await getDocs(query(collection(db,"activityFolders"), orderBy("createdAt","desc")));
    folders = [];
    snap.forEach(doc => folders.push({ id:doc.id, ...doc.data() }));
  }catch(e){
    folders = JSON.parse(localStorage.getItem("activityFolders") || "[]");
  }
}

async function loadActivities(){
  try{
    const snap = await getDocs(query(collection(db,"activities"), orderBy("createdAt","desc")));
    activities = [];
    snap.forEach(doc => activities.push({ id:doc.id, ...doc.data() }));
  }catch(e){
    activities = JSON.parse(localStorage.getItem("activities") || "[]");
  }
}

function renderFolders(){
  const allCount = activities.length;

  $("folderList").innerHTML = `
    <button class="folder-btn ${selectedFolderId === "all" ? "active" : ""}" data-folder="all" data-name="All Activities" type="button">
      <strong>All Activities<span>${allCount} activities</span></strong>
    </button>
    ${folders.map(folder => {
      const count = activities.filter(a => a.folderId === folder.id).length;
      return `
        <button class="folder-btn ${selectedFolderId === folder.id ? "active" : ""}" data-folder="${folder.id}" data-name="${escapeHtml(folder.name)}" type="button">
          <strong>${escapeHtml(folder.name)}<span>${count} activities</span></strong>
        </button>
      `;
    }).join("")}
  `;

  document.querySelectorAll("[data-folder]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedFolderId = btn.dataset.folder;
      $("selectedFolderTitle").textContent = btn.dataset.name;
      renderFolders();
      renderActivities();
    });
  });

  renderFolderSelect();
}

function renderFolderSelect(){
  $("activityFolder").innerHTML = `<option value="">Select folder</option>` + folders.map(folder => {
    return `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`;
  }).join("");
}

function renderActivities(){
  const visible = selectedFolderId === "all"
    ? activities
    : activities.filter(a => a.folderId === selectedFolderId);

  if(!visible.length){
    $("activityList").innerHTML = `<div class="empty">No activity saved in this folder yet.</div>`;
    return;
  }

  $("activityList").innerHTML = visible.map(item => `
    <article class="activity-card" data-activity-id="${item.id}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <h3>${escapeHtml(item.title || "Untitled Activity")}</h3>
          <p>${escapeHtml(item.level || "No level")} · ${escapeHtml(item.teacher || "No teacher")} · ${escapeHtml(item.learner || "No learner/group")}</p>
          <p>${item.questions?.length || 0} question blocks · ${escapeHtml(item.instructions || "No instructions")}</p>
        </div>
        <span class="badge">${escapeHtml(item.status || "Draft")}</span>
      </div>
    </article>
  `).join("");
  // Attach click to open learner slide view
  document.querySelectorAll(".activity-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-activity-id");
      const activity = activities.find(a => a.id === id);
      if(!activity) return;

      sessionStorage.setItem("currentActivity", JSON.stringify(activity));
      window.location.href = "/learner/activity.html";
    });
  });
}

function renderQuestions(){
  if(!questions.length){
    $("questionList").innerHTML = `<div class="empty">Add a question block from the left to build your activity.</div>`;
    return;
  }

  $("questionList").innerHTML = questions.map((q,index) => `
    <article class="question-card" data-q="${q.id}">
      <div class="question-top">
        <strong>${index + 1}. ${escapeHtml(q.type)}</strong>
        <div class="question-actions">
          <button data-up="${q.id}" type="button">↑</button>
          <button data-down="${q.id}" type="button">↓</button>
          <button data-remove="${q.id}" type="button">×</button>
        </div>
      </div>

      <label>
        Question / Prompt Text
        <textarea rows="3" data-field="prompt" data-id="${q.id}">${escapeHtml(q.prompt)}</textarea>
      </label>

      ${mediaUploadHtml(q)}

      ${optionsHtml(q)}

      <label>
        Required?
        <select data-field="required" data-id="${q.id}">
          <option value="false" ${!q.required ? "selected" : ""}>Optional</option>
          <option value="true" ${q.required ? "selected" : ""}>Required</option>
        </select>
      </label>

      <div class="media-row">
        <div class="panel-label">Allowed Learner Responses</div>
        <div class="response-options">
          ${responseCheck(q,"text","Text Response")}
          ${responseCheck(q,"audio","Audio Response")}
          ${responseCheck(q,"video","Video Response")}
          ${responseCheck(q,"image","Photo/Image Response")}
        </div>
      </div>
    </article>
  `).join("");

  bindQuestionControls();
}

function mediaUploadHtml(q){
  const mediaTypes = ["Image Question","Audio Question","Video Question"];
  if(!mediaTypes.includes(q.type)) return "";

  return `
    <div class="media-row">
      <label>
        Upload ${q.type.replace(" Question","")} File
        <input type="file" data-media="${q.id}" accept="${q.type === "Image Question" ? "image/*" : q.type === "Audio Question" ? "audio/*" : "video/*"}">
      </label>
      <div class="media-preview">${q.mediaName ? escapeHtml(q.mediaName) : "No media uploaded yet."}</div>
    </div>
  `;
}

function optionsHtml(q){
  if(!["Multiple Choice","Dropdown"].includes(q.type)) return "";

  return `
    <label>
      Options — one per line
      <textarea rows="4" data-field="options" data-id="${q.id}">${escapeHtml((q.options || []).join("\n"))}</textarea>
    </label>
  `;
}

function responseCheck(q,key,label){
  const checked = q.responses?.includes(key) ? "checked" : "";
  return `
    <label class="check-pill">
      <input type="checkbox" data-response="${key}" data-id="${q.id}" ${checked}>
      ${label}
    </label>
  `;
}

function bindQuestionControls(){
  document.querySelectorAll("[data-field]").forEach(input => {
    input.addEventListener("input", () => {
      const q = questions.find(item => item.id === input.dataset.id);
      if(!q) return;

      if(input.dataset.field === "prompt") q.prompt = input.value;
      if(input.dataset.field === "required") q.required = input.value === "true";
      if(input.dataset.field === "options") q.options = input.value.split("\n").map(v => clean(v)).filter(Boolean);
    });

    input.addEventListener("change", () => {
      const q = questions.find(item => item.id === input.dataset.id);
      if(!q) return;
      if(input.dataset.field === "required") q.required = input.value === "true";
    });
  });

  document.querySelectorAll("[data-response]").forEach(input => {
    input.addEventListener("change", () => {
      const q = questions.find(item => item.id === input.dataset.id);
      if(!q) return;

      q.responses = q.responses || [];

      if(input.checked && !q.responses.includes(input.dataset.response)){
        q.responses.push(input.dataset.response);
      }

      if(!input.checked){
        q.responses = q.responses.filter(r => r !== input.dataset.response);
      }
    });
  });

  document.querySelectorAll("[data-media]").forEach(input => {
    input.addEventListener("change", () => {
      const q = questions.find(item => item.id === input.dataset.media);
      if(!q) return;

      q.mediaFile = input.files[0] || null;
      q.mediaName = q.mediaFile ? q.mediaFile.name : "";
      renderQuestions();
    });
  });

  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      questions = questions.filter(q => q.id !== btn.dataset.remove);
      renderQuestions();
    });
  });

  document.querySelectorAll("[data-up]").forEach(btn => {
    btn.addEventListener("click", () => moveQuestion(btn.dataset.up,-1));
  });

  document.querySelectorAll("[data-down]").forEach(btn => {
    btn.addEventListener("click", () => moveQuestion(btn.dataset.down,1));
  });
}

function moveQuestion(id,dir){
  const index = questions.findIndex(q => q.id === id);
  const next = index + dir;
  if(index < 0 || next < 0 || next >= questions.length) return;
  [questions[index],questions[next]] = [questions[next],questions[index]];
  renderQuestions();
}

function addQuestion(type){
  let responses = ["text"];

  if(type === "Audio Question") responses = ["audio","text"];
  if(type === "Video Question") responses = ["video","audio","text"];
  if(type === "Image Question") responses = ["text","audio"];
  if(type === "File Upload Prompt") responses = ["image","video","audio"];

  questions.push({
    id: uid(),
    type,
    prompt: "",
    required: false,
    responses,
    options: ["Option 1","Option 2"],
    mediaURL: "",
    mediaName: ""
  });

  renderQuestions();
}

async function uploadQuestionMedia(activitySlug){
  const uploaded = [];

  for(const q of questions){
    const copy = { ...q };
    delete copy.mediaFile;

    if(q.mediaFile){
      const path = `activity-question-media/${activitySlug}/${q.id}-${q.mediaFile.name}`;
      const storageRef = ref(storage,path);
      await uploadBytes(storageRef,q.mediaFile);
      copy.mediaURL = await getDownloadURL(storageRef);
      copy.mediaPath = path;
      copy.mediaType = q.mediaFile.type;
    }

    uploaded.push(copy);
  }

  return uploaded;
}

async function saveFolder(){
  const name = clean($("folderName").value);
  if(!name){
    toast("Please enter a folder name.");
    return;
  }

  const payload = {
    name,
    createdAt: new Date().toISOString()
  };

  try{
    const docRef = await addDoc(collection(db,"activityFolders"), {
      name,
      createdAt: serverTimestamp()
    });
    folders.unshift({ id: docRef.id, ...payload });
  }catch(e){
    folders.unshift({ id:"local-" + Date.now(), ...payload });
    localStorage.setItem("activityFolders", JSON.stringify(folders));
  }

  $("folderName").value = "";
  closeModal("folderModal");
  renderFolders();
  toast("Folder created.");
}

async function saveActivity(){
  const title = clean($("activityTitle").value);
  const folderId = $("activityFolder").value;
  const level = clean($("activityLevel").value);

  if(!title || !folderId || !level){
    toast("Please add title, folder, and level.");
    return;
  }

  if(!questions.length){
    toast("Please add at least one question.");
    return;
  }

  toast("Saving activity...");

  const activitySlug = slug(title) + "-" + Date.now();
  const finalQuestions = await uploadQuestionMedia(activitySlug);

  const payload = {
    title,
    folderId,
    level,
    teacher: clean($("activityTeacher").value),
    learner: clean($("activityLearner").value),
    status: clean($("activityStatus").value) || "Draft",
published: clean($("activityStatus").value) === "Published",
    instructions: clean($("activityInstructions").value),
    questions: finalQuestions,
    createdAt: new Date().toISOString()
  };

  try{
    const docRef = await addDoc(collection(db,"activities"), {
      ...payload,
      createdAt: serverTimestamp()
    });
    activities.unshift({ id: docRef.id, ...payload });
  }catch(e){
    activities.unshift({ id:"local-" + Date.now(), ...payload });
    localStorage.setItem("activities", JSON.stringify(activities));
  }

  clearBuilder();
  closeModal("builderModal");
  renderFolders();
  renderActivities();
  renderTracker();
  toast("Activity saved.");
}

function clearBuilder(){
  ["activityTitle","activityTeacher","activityLearner","activityInstructions"].forEach(id => $(id).value = "");
  $("activityFolder").value = "";
  $("activityLevel").value = "";
  $("activityStatus").value = "Draft";
  questions = [];
  renderQuestions();
}

function renderTracker(){
  const created = activities.length;
  const published = activities.filter(a => a.status === "Published").length;
  const completed = activities.filter(a => a.status === "Completed").length;

  $("createdCount").textContent = created;
  $("publishedCount").textContent = published;
  $("completedCount").textContent = completed;

  if(!activities.length){
    $("trackerList").innerHTML = `<div class="empty">No activity records yet.</div>`;
    return;
  }

  $("trackerList").innerHTML = activities.map(item => `
    <article class="activity-card" data-activity-id="${item.id}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.status)} · ${escapeHtml(item.level)} · ${item.questions?.length || 0} questions</p>
    </article>
  `).join("");
}

function bind(){
  $("openFolderBtn").addEventListener("click", () => openModal("folderModal"));
  $("openBuilderBtn").addEventListener("click", () => openModal("builderModal"));
  $("openTrackerBtn").addEventListener("click", () => {
    renderTracker();
    openModal("trackerModal");
  });

  $("saveFolderBtn").addEventListener("click", saveFolder);
  $("saveActivityBtn").addEventListener("click", saveActivity);

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addQuestion(btn.dataset.add));
  });
}

async function init(){
  bind();
  await loadFolders();
  await loadActivities();
  renderFolders();
  renderActivities();
  renderQuestions();
  renderTracker();
}

init();


