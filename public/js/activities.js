import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const folderList = document.getElementById("folderList");
const folderCount = document.getElementById("folderCount");
const activityList = document.getElementById("activityList");
const activityCount = document.getElementById("activityCount");
const selectedFolderTitle = document.getElementById("selectedFolderTitle");
const activityFolder = document.getElementById("activityFolder");

const folderModal = document.getElementById("folderModal");
const builderModal = document.getElementById("builderModal");
const trackerModal = document.getElementById("trackerModal");

const openFolderBtn = document.getElementById("openFolderBtn");
const openBuilderBtn = document.getElementById("openBuilderBtn");
const openTrackerBtn = document.getElementById("openTrackerBtn");

const saveFolderBtn = document.getElementById("saveFolderBtn");
const folderName = document.getElementById("folderName");
const folderStatus = document.getElementById("folderStatus");

const form = document.getElementById("activityForm");
const activityStatusText = document.getElementById("activityStatusText");
const questionList = document.getElementById("questionList");
const addQuestionBtn = document.getElementById("addQuestionBtn");

const trackerList = document.getElementById("trackerList");
const trackerCount = document.getElementById("trackerCount");
const createdCount = document.getElementById("createdCount");
const publishedCount = document.getElementById("publishedCount");
const completedCount = document.getElementById("completedCount");

let folders = [];
let activities = [];
let selectedFolderId = "all";
let selectedType = "Quiz";

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function value(id){
  return (document.getElementById(id)?.value || "").trim();
}

function openModal(modal){
  modal.classList.remove("hidden");
}

function closeModal(modal){
  modal.classList.add("hidden");
}

function formatDate(value){
  if(!value) return "Date not available";
  if(value.toDate) return value.toDate().toLocaleString();
  return String(value);
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.close);
    if(modal) closeModal(modal);
  });
});

openFolderBtn.addEventListener("click", () => openModal(folderModal));
openBuilderBtn.addEventListener("click", () => openModal(builderModal));
openTrackerBtn.addEventListener("click", () => {
  renderTracker();
  openModal(trackerModal);
});

document.querySelectorAll(".type-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".type-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedType = button.dataset.type;
  });
});

function addQuestion(text = ""){
  const item = document.createElement("div");
  item.className = "question-item";
  item.innerHTML = `
    <div class="question-top">
      <strong></strong>
      <button type="button">Remove</button>
    </div>
    <textarea rows="3">${escapeHtml(text)}</textarea>
  `;

  item.querySelector("button").addEventListener("click", () => {
    item.remove();
    renumberQuestions();
  });

  questionList.appendChild(item);
  renumberQuestions();
}

function renumberQuestions(){
  [...questionList.querySelectorAll(".question-item")].forEach((item, index) => {
    item.querySelector("strong").textContent = `Question / Task ${index + 1}`;
  });
}

addQuestionBtn.addEventListener("click", () => addQuestion());

function renderFolderOptions(){
  activityFolder.innerHTML = `
    <option value="">Select Folder</option>
    ${folders.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`).join("")}
  `;
}

function renderFolders(){
  folderCount.textContent = String(folders.length);

  const allCount = activities.length;

  folderList.innerHTML = `
    <button class="activity-folder ${selectedFolderId === "all" ? "active" : ""}" data-id="all" data-name="All Activities" type="button">
      <span></span>
      <div>
        <strong>All Activities</strong>
        <small>${allCount} ${allCount === 1 ? "activity" : "activities"}</small>
      </div>
    </button>
    ${folders.map((folder) => {
      const count = activities.filter((item) => item.folderId === folder.id).length;
      return `
        <button class="activity-folder ${selectedFolderId === folder.id ? "active" : ""}" data-id="${folder.id}" data-name="${escapeHtml(folder.name)}" type="button">
          <span></span>
          <div>
            <strong>${escapeHtml(folder.name)}</strong>
            <small>${count} ${count === 1 ? "activity" : "activities"}</small>
          </div>
        </button>
      `;
    }).join("")}
  `;

  folderList.querySelectorAll(".activity-folder").forEach((button) => {
    button.addEventListener("click", () => {
      selectedFolderId = button.dataset.id;
      selectedFolderTitle.textContent = button.dataset.name;
      renderFolders();
      renderActivities();
    });
  });

  renderFolderOptions();
}

function renderActivities(){
  const visible = selectedFolderId === "all"
    ? activities
    : activities.filter((item) => item.folderId === selectedFolderId);

  activityCount.textContent = `${visible.length} ${visible.length === 1 ? "activity" : "activities"}`;

  if(!visible.length){
    activityList.innerHTML = `<div class="empty-state">No activity saved in this folder yet.</div>`;
    return;
  }

  activityList.innerHTML = visible.map((item) => `
    <article class="activity-card">
      <div class="activity-card-top">
        <div>
          <p>${escapeHtml(item.type || "Activity")}</p>
          <h3>${escapeHtml(item.title || "Untitled Activity")}</h3>
        </div>
        <span>${escapeHtml(item.status || "Created")}</span>
      </div>

      <div class="activity-meta-grid">
        <div><small>Level</small><strong>${escapeHtml(item.level || "Not set")}</strong></div>
        <div><small>Teacher</small><strong>${escapeHtml(item.teacher || "Not set")}</strong></div>
        <div><small>Learner / Group</small><strong>${escapeHtml(item.learnerGroup || "Not set")}</strong></div>
        <div><small>Questions</small><strong>${(item.questions || []).length}</strong></div>
      </div>

      <p class="activity-note">${escapeHtml(item.instructions || "No instructions added.")}</p>
    </article>
  `).join("");
}

function renderTracker(){
  const created = activities.filter((item) => item.status === "Created").length;
  const published = activities.filter((item) => item.status === "Published").length;
  const completed = activities.filter((item) => item.status === "Completed").length;

  trackerCount.textContent = `${activities.length} ${activities.length === 1 ? "record" : "records"}`;
  createdCount.textContent = created;
  publishedCount.textContent = published;
  completedCount.textContent = completed;

  if(!activities.length){
    trackerList.innerHTML = `<div class="empty-state">No activity records yet.</div>`;
    return;
  }

  trackerList.innerHTML = activities.map((item) => {
    const folder = folders.find((f) => f.id === item.folderId);
    return `
      <article class="tracker-row">
        <div>
          <p>${escapeHtml(item.type || "Activity")} · ${escapeHtml(item.status || "Created")}</p>
          <h3>${escapeHtml(item.title || "Untitled Activity")}</h3>
          <small>Folder: ${escapeHtml(folder?.name || "No folder")} · Level: ${escapeHtml(item.level || "Not set")}</small>
        </div>
        <div>
          <strong>${formatDate(item.createdAt)}</strong>
          <small>Created timestamp</small>
        </div>
      </article>
    `;
  }).join("");
}

async function loadFolders(){
  const q = query(collection(db, "activityFolders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  folders = [];
  snapshot.forEach((docSnap) => {
    folders.push({ id:docSnap.id, ...docSnap.data() });
  });
}

async function loadActivities(){
  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  activities = [];
  snapshot.forEach((docSnap) => {
    activities.push({ id:docSnap.id, ...docSnap.data() });
  });
}

saveFolderBtn.addEventListener("click", async () => {
  const name = folderName.value.trim();

  if(!name){
    folderStatus.textContent = "Please enter a folder name.";
    return;
  }

  folderStatus.textContent = "Saving folder...";

  await addDoc(collection(db, "activityFolders"), {
    name,
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });

  folderName.value = "";
  folderStatus.textContent = "Folder saved.";

  await refreshAll();
  setTimeout(() => closeModal(folderModal), 700);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const questions = [...questionList.querySelectorAll("textarea")]
    .map((box) => box.value.trim())
    .filter(Boolean);

  const folderId = value("activityFolder");
  const title = value("activityTitle");
  const level = value("activityLevel");

  if(!title || !folderId || !level){
    activityStatusText.textContent = "Please enter title, folder, and level.";
    return;
  }

  if(!questions.length){
    activityStatusText.textContent = "Please add at least one question or task.";
    return;
  }

  activityStatusText.textContent = "Saving activity...";

  await addDoc(collection(db, "activities"), {
    type:selectedType,
    title,
    folderId,
    level,
    teacher:value("activityTeacher"),
    learnerGroup:value("activityLearner"),
    status:value("activityStatus") || "Created",
    instructions:value("activityInstructions"),
    questions,
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });

  form.reset();
  questionList.innerHTML = "";
  addQuestion();
  activityStatusText.textContent = "Activity saved.";

  await refreshAll();
  setTimeout(() => closeModal(builderModal), 700);
});

async function refreshAll(){
  await loadFolders();
  await loadActivities();
  renderFolders();
  renderActivities();
  renderTracker();
}

addQuestion();
refreshAll();
