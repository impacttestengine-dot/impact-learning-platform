import { API_BASE_URL } from "/js/api-config.js";

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
    fullName: getValue("fullName"),
    age: getValue("age"),
    enrollmentDate: getValue("enrollmentDate"),
    level: getValue("level"),
    placementResult: getValue("placementResult"),
    progressionCount: getValue("progressionCount") || "0",
    teacher: getValue("teacher"),
    parentName: getValue("parentName"),
    parentPhone: getValue("parentPhone"),
    parentEmail: getValue("parentEmail"),
    classDays: getValue("classDays"),
    status: getValue("status") || "Active",
    notes: getValue("notes")
  };
}

function setEditorMode(mode, recordName = "") {
  const button = form.querySelector(".glass-btn");

  if (mode === "edit") {
    editorTitle.textContent = "Edit Record";
    editorHint.textContent = recordName ? `Editing ${recordName}` : "Editing selected record";
    if (button) button.textContent = "Update Record";
  } else {
    editorTitle.textContent = "New Record";
    editorHint.textContent = "Create a new learner record";
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
  setValue("teacher", record.teacher);
  setValue("parentName", record.parentName);
  setValue("parentPhone", record.parentPhone);
  setValue("parentEmail", record.parentEmail);
  setValue("classDays", record.classDays);
  setValue("status", record.status || "Active");
  setValue("notes", record.notes);

  setEditorMode("edit", record.fullName || "record");
  formStatus.textContent = "";

  document.querySelector(".form-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    const name = escapeHtml(record.fullName || "Unnamed Learner");
    const level = escapeHtml(record.level || "Level not set");
    const placement = escapeHtml(record.placementResult || "Placement not entered");
    const progressionCount = escapeHtml(record.progressionCount || "0");
    const enrollment = escapeHtml(record.enrollmentDate || "Enrollment date not set");
    const teacher = escapeHtml(record.teacher || "Teacher not assigned");
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
              ${level} · ${teacher}<br>
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
    const response = await fetch(`${API_BASE_URL}/api/records`);
    const data = await response.json();

    if (!data.ok) {
      recordsList.innerHTML = `<div class="empty-state">${escapeHtml(data.message || "Could not load records.")}</div>`;
      return;
    }

    recordsCache = data.records || [];
    renderRecords();

  } catch (error) {
    console.error(error);
    recordsList.innerHTML = '<div class="empty-state">Could not connect to backend. Make sure backend is running.</div>';
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName = getValue("fullName");

  if (!fullName) {
    formStatus.textContent = "Please enter the learner name.";
    return;
  }

  const record = collectRecordData();

  try {
    let response;

    if (editingRecordId) {
      formStatus.textContent = "Updating record...";

      response = await fetch(`${API_BASE_URL}/api/records/${editingRecordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(record)
      });

    } else {
      formStatus.textContent = "Saving record...";

      response = await fetch(`${API_BASE_URL}/api/records/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(record)
      });
    }

    const data = await response.json();

    if (!data.ok) {
      formStatus.textContent = data.message || "Could not save record.";
      return;
    }

    formStatus.textContent = editingRecordId ? "Record updated." : "Record saved.";

    if (!editingRecordId) {
      resetEditMode();
    }

    await loadRecords();

  } catch (error) {
    console.error(error);
    formStatus.textContent = "Could not connect to backend. Make sure backend is running.";
  }
});

loadRecords();

