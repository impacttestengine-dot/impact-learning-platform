import { API_BASE_URL } from "/js/api-config.js";

const loggerList = document.getElementById("loggerList");

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStamp(value){
  if(!value) return "Not recorded";

  if(value._seconds){
    return new Date(value._seconds * 1000).toLocaleString();
  }

  return String(value);
}

async function loadLogs(){
  try{
    const response = await fetch(`${API_BASE_URL}/api/classes`);
    const data = await response.json();

    if(!data.ok){
      loggerList.innerHTML = `<div class="empty-state">${escapeHtml(data.message || "Could not load class logs.")}</div>`;
      return;
    }

    const classes = (data.classes || []).filter((item) =>
      ["Completed", "Needs Review", "Cancelled"].includes(item.status)
    );

    if(!classes.length){
      loggerList.innerHTML = `<div class="empty-state">No completed class logs yet.</div>`;
      return;
    }

    loggerList.innerHTML = classes.map((item) => {
      return `
        <article class="record-item">
          <div class="record-top">
            <div>
              <div class="record-name">${escapeHtml(item.classTitle || "Untitled Class")}</div>
              <div class="record-meta">
                impactLearners/Group: ${escapeHtml(item.impactLearnersGroup || "Not set")}<br>
                personnel: ${escapeHtml(item.personnel || "Not set")}<br>
                Scheduled: ${escapeHtml(item.classDay || "Day not set")} at ${escapeHtml(item.time || "Time not set")}<br>
                Expected Duration: ${escapeHtml(item.duration || "Not set")}<br>
                Actual Duration: ${escapeHtml(item.actualDurationMinutes || "Not logged")} minutes<br>
                Started: ${escapeHtml(formatStamp(item.startedAt))}<br>
                Completed: ${escapeHtml(formatStamp(item.completedAt))}<br>
                Review: ${escapeHtml(item.reviewReason || "None")}
              </div>
            </div>
            <span class="badge">${escapeHtml(item.status || "Logged")}</span>
          </div>
        </article>
      `;
    }).join("");

  }catch(error){
    console.error(error);
    loggerList.innerHTML = `<div class="empty-state">Could not connect to backend.</div>`;
  }
}

loadLogs();






