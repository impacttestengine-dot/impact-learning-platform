import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const templates = document.querySelectorAll(".activity-template-card");
const selectedActivityType = document.getElementById("selectedActivityType");
const questionList = document.getElementById("questionList");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const form = document.getElementById("activityForm");
const activityList = document.getElementById("activityList");
const activityCount = document.getElementById("activityCount");

let selectedType = "Quiz";
let activities = [];

function notify(message){
  let toast = document.getElementById("impactToast");
  if(!toast){
    toast = document.createElement("div");
    toast.id = "impactToast";
    toast.className = "impact-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "impact-toast show";
  setTimeout(() => toast.className = "impact-toast", 2500);
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

function addQuestion(text = ""){
  const item = document.createElement("div");
  item.className = "question-item";
  item.innerHTML = `
    <div class="question-number"></div>
    <textarea rows="3">${escapeHtml(text)}</textarea>
    <button type="button" class="remove-question">Remove</button>
  `;

  item.querySelector(".remove-question").addEventListener("click", () => {
    item.remove();
    renumberQuestions();
  });

  questionList.appendChild(item);
  renumberQuestions();
}

function renumberQuestions(){
  [...questionList.querySelectorAll(".question-item")].forEach((item, index) => {
    item.querySelector(".question-number").textContent = `Question ${index + 1}`;
  });
}

function renderActivities(){
  if(activityCount){
    activityCount.textContent = `${activities.length} ${activities.length === 1 ? "activity" : "activities"}`;
  }

  if(!activities.length){
    activityList.innerHTML = `<div class="empty-state">No activity created yet.</div>`;
    return;
  }

  activityList.innerHTML = activities.map((item) => `
    <article class="activity-saved-card">
      <div class="class-card-head">
        <div>
          <p class="class-card-label">${escapeHtml(item.type)}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <span class="class-status-pill">${escapeHtml(item.level)}</span>
      </div>

      <div class="class-detail-grid">
        <div><span>Teacher</span><strong>${escapeHtml(item.teacher || "Not set")}</strong></div>
        <div><span>Learner / Group</span><strong>${escapeHtml(item.learnerGroup || "Not set")}</strong></div>
        <div><span>Questions / Tasks</span><strong>${(item.questions || []).length}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(item.status || "Draft")}</strong></div>
      </div>

      <p class="activity-instructions">${escapeHtml(item.instructions || "No instructions added.")}</p>
    </article>
  `).join("");
}

async function loadActivities(){
  try{
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    activities = [];
    snapshot.forEach((docSnap) => {
      activities.push({ id:docSnap.id, ...docSnap.data() });
    });

    renderActivities();
  }catch(error){
    console.error(error);
    activityList.innerHTML = `<div class="empty-state">Could not load activities from Firestore.</div>`;
  }
}

templates.forEach((button) => {
  button.addEventListener("click", () => {
    templates.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedType = button.dataset.type;
    selectedActivityType.textContent = selectedType;
  });
});

addQuestionBtn?.addEventListener("click", () => addQuestion());

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const questions = [...questionList.querySelectorAll("textarea")]
    .map((box) => box.value.trim())
    .filter(Boolean);

  const activity = {
    type:selectedType,
    title:value("activityTitle"),
    level:value("activityLevel"),
    teacher:value("teacher"),
    learnerGroup:value("learnerGroup"),
    instructions:value("instructions"),
    questions,
    status:"Draft",
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  };

  if(!activity.title || !activity.level){
    notify("Please enter activity title and level.");
    return;
  }

  if(!questions.length){
    notify("Please add at least one question or task.");
    return;
  }

  try{
    await addDoc(collection(db, "activities"), activity);

    form.reset();
    questionList.innerHTML = "";
    addQuestion();
    notify("Activity saved.");
    await loadActivities();

  }catch(error){
    console.error(error);
    notify("Could not save activity to Firestore.");
  }
});

addQuestion();
loadActivities();
