import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const form = document.getElementById("recordForm");
const formStatus = document.getElementById("formStatus");
const recordsList = document.getElementById("recordsList");
const recordCount = document.getElementById("recordCount");
const editorTitle = document.getElementById("editorTitle");
const editorHint = document.getElementById("editorHint");

let recordsCache = [];
let editingRecordId = null;

function getValue(id) {
  return (document.getElementById(id)?.value || "").trim();
}

function setValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value || "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function collectRecordData() {
  return {
    fullName:getValue("fullName"),
    age:getValue("age"),
    enrollmentDate:getValue("enrollmentDate"),
    level:getValue("level"),
    placementResult:getValue("placementResult"),
    progressionCount:getValue("progressionCount") || "0",
    personnel:getValue("personnel"),
    parentName:getValue("parentName"),
    parentPhone:getValue("parentPhone"),
    parentEmail:getValue("parentEmail"),
    classDays:getValue("classDays"),
    status:getValue("status") || "Active",
    notes:getValue("notes"),
    updatedAt:serverTimestamp()
  };
}

function setEditorMode(mode, recordName = "") {
  const button = form?.querySelector(".glass-btn");

  if (mode === "edit") {
    editorTitle.textContent = "Edit Record";
    editorHint.textContent = recordName ? `Editing ${recordName}` : "Editing selected record";
    if (button) button.textContent = "Update Record";
  } else {
    editorTitle.textContent = "New Record";
    editorHint.textContent = "Create a new impactLearners record";
    if (button) button.textContent = "Save Record";
  }
}

function resetEditMode() {
  editingRecordId = null;
  form.reset();
  setValue("status", "Active");
  setValue("progressionCount", "0");
  setEditorMode("new");
  formStatus.textContent = "";
  renderRecords();
}

function enterEditMode(recordId) {
  const record = recordsCache.find((item) => item.id === recordId);

  if (!record) {
    formStatus.textContent = "Could not find this record.";
    return;
  }

  editingRecordId = recordId;

  setValue("fullName", record.fullName);
  setValue("age", record.age);
  setValue("enrollmentDate", record.enrollmentDate);
  setValue("level", record.level);
  setValue("placementResult", record.placementResult);
  setValue("progressionCount", record.progressionCount || "0");
  setValue("personnel", record.personnel);
  setValue("parentName", record.parentName);
  setValue("parentPhone", record.parentPhone);
  setValue("parentEmail", record.parentEmail);
  setValue("classDays", record.classDays);
  setValue("status", record.status || "Active");
  setValue("notes", record.notes);

  setEditorMode("edit", record.fullName || "record");
  formStatus.textContent = "";

  document.querySelector(".form-card")?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  renderRecords();
}

window.openRecord = enterEditMode;
window.cancelEdit = resetEditMode;
window.newRecord = resetEditMode;

function renderRecords() {
  recordCount.textContent = `${recordsCache.length} ${recordsCache.length === 1 ? "record" : "records"}`;

  if (!recordsCache.length) {
    recordsList.innerHTML = '<div class="empty-state">No records yet.</div>';
    return;
  }

  recordsList.innerHTML = recordsCache.map((record) => {
    const name = escapeHtml(record.fullName || "Unnamed impactLearners");
    const level = escapeHtml(record.level || "Level not set");
    const placement = escapeHtml(record.placementResult || "Placement not entered");
    const progressionCount = escapeHtml(record.progressionCount || "0");
    const enrollment = escapeHtml(record.enrollmentDate || "Enrollment date not set");
    const personnel = escapeHtml(record.personnel || "personnel not assigned");
    const parent = escapeHtml(record.parentName || "Parent not added");
    const phone = escapeHtml(record.parentPhone || "Phone not added");
    const status = escapeHtml(record.status || "Active");
    const activeClass = record.id === editingRecordId ? "active" : "";

    return `
      <article class="record-item ${activeClass}" onclick="openRecord('${record.id}')">
        <div class="record-top">
          <div>
            <div class="record-name">${name}</div>
            <div class="record-meta">
              ${level} · ${personnel}<br>
              Placement: ${placement}<br>
              Progressions: ${progressionCount}<br>
              Enrolled: ${enrollment}<br>
              Parent: ${parent} · ${phone}
            </div>
          </div>
          <span class="badge">${status}</span>
        </div>
      </article>
    `;
  }).join("");
}

async function loadRecords() {
  recordsList.innerHTML = '<div class="empty-state">Loading records...</div>';

  try {
    const q = query(collection(db, "impactLearnerss"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    recordsCache = [];
    snapshot.forEach((docSnap) => {
      recordsCache.push({ id:docSnap.id, ...docSnap.data() });
    });

    renderRecords();

  } catch (error) {
    console.error(error);
    recordsList.innerHTML = '<div class="empty-state">Could not load records from Firestore.</div>';
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName = getValue("fullName");

  if (!fullName) {
    formStatus.textContent = "Please enter the impactLearners name.";
    return;
  }

  const record = collectRecordData();

  try {
    if (editingRecordId) {
      formStatus.textContent = "Updating record...";
      await updateDoc(doc(db, "impactLearnerss", editingRecordId), record);
      formStatus.textContent = "Record updated.";
    } else {
      formStatus.textContent = "Saving record...";
      await addDoc(collection(db, "impactLearnerss"), {
        ...record,
        createdAt:serverTimestamp()
      });
      formStatus.textContent = "Record saved.";
      resetEditMode();
    }

    await loadRecords();

  } catch (error) {
    console.error(error);
    formStatus.textContent = "Could not save record to Firestore.";
  }
});

loadRecords();
