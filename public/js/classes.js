const MEET_LINK_POOL = [
  { id: "room1", url: "https://meet.google.com/ukw-macm-cvo" },
  { id: "room2", url: "https://meet.google.com/fxh-gazg-jpp" },
  { id: "room3", url: "https://meet.google.com/rps-qrqe-upw" },
  { id: "room4", url: "https://meet.google.com/mea-ihvu-jhi" }
];

function assignMeetRoom(){
  const index = Math.floor(Math.random() * MEET_LINK_POOL.length);
  return MEET_LINK_POOL[index];
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "/js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("classForm");
const formStatus = document.getElementById("formStatus");
const classesList = document.getElementById("classesList");
const classCount = document.getElementById("classCount");

function value(id){
  return (document.getElementById(id)?.value || "").trim();
}

function escapeHtml(input){
  return String(input || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function minutesBetween(startIso, endDate = new Date()){
  if(!startIso) return 0;
  const start = new Date(startIso);
  const diff = endDate.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 60000));
}

async function startClass(classId){
  await updateDoc(doc(db, "classes", classId), {
    status: "In Progress",
    startedAt: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
  await loadClasses();
}

async function completeClass(classId, startedAt){
  const duration = minutesBetween(startedAt);

  await updateDoc(doc(db, "classes", classId), {
    status: "Completed",
    completedAt: new Date().toISOString(),
    actualDurationMinutes: duration,
    reviewReason: "",
    updatedAt: serverTimestamp()
  });

  await loadClasses();
}

async function endClass(classId, startedAt){
  const duration = minutesBetween(startedAt);

  if(duration < 35){
    const reason = prompt(
      "This class ended earlier than expected. Please enter what happened: cancelled, technical issue, learner absent, or completed early."
    );

    if(!reason || !reason.trim()){
      alert("Please provide a reason before ending this class early.");
      return;
    }

    await updateDoc(doc(db, "classes", classId), {
      status: "Needs Review",
      completedAt: new Date().toISOString(),
      actualDurationMinutes: duration,
      reviewReason: reason.trim(),
      updatedAt: serverTimestamp()
    });

    await loadClasses();
    return;
  }

  await completeClass(classId, startedAt);
}

function generateMeetNotice(){
  alert(
    "Backend connection needed: this button will later call the Google Calendar API to create a Google Meet link automatically."
  );
}

window.startClass = startClass;
window.endClass = endClass;
window.generateMeetNotice = generateMeetNotice;

async function loadClasses(){
  classesList.innerHTML = '<div class="empty-state">Loading classes...</div>';

  try{
    const q = query(collection(db, "classes"), orderBy("classDate", "asc"));
    const snapshot = await getDocs(q);

    const classes = [];
    snapshot.forEach((docSnap) => classes.push({ id:docSnap.id, ...docSnap.data() }));

    classCount.textContent = `${classes.length} ${classes.length === 1 ? "class" : "classes"}`;

    if(!classes.length){
      classesList.innerHTML = '<div class="empty-state">No classes yet.</div>';
      return;
    }

    classesList.innerHTML = classes.map((item) => {
      const title = escapeHtml(item.classTitle || "Untitled Class");
      const learner = escapeHtml(item.learnerName || "Learner not set");
      const teacher = escapeHtml(item.teacherName || "Teacher not set");
      const date = escapeHtml(item.classDay || "Day not set");
      const time = escapeHtml(item.classTime || "Time not set");
      const duration = escapeHtml(item.duration || "Duration not set");
      const status = escapeHtml(item.status || "Scheduled");
      const link = item.meetingLink ? escapeHtml(item.meetingLink) : "";
      const startedAt = item.startedAt || "";
      const actualDuration = item.actualDurationMinutes ? `${item.actualDurationMinutes} mins` : "Not logged";
      const reviewReason = item.reviewReason ? escapeHtml(item.reviewReason) : "";

      let actionButtons = "";

      if(status === "Scheduled"){
        actionButtons = `
          <button class="class-action" onclick="startClass('${item.id}')">Start Class</button>
        `;
      }

      if(status === "In Progress"){
        actionButtons = `
          <button class="class-action" onclick="endClass('${item.id}', '${startedAt}')">End Class</button>
        `;
      }

      return `
        <article class="class-item">
          <div class="class-top">
            <div>
              <div class="class-title">${title}</div>
              <div class="class-meta">
                ${learner} · ${teacher}<br>
                ${date} at ${time} · ${duration}<br>
                Duration logged: ${actualDuration}
                ${reviewReason ? `<br>Review reason: ${reviewReason}` : ""}
              </div>
            </div>
            <span class="badge">${status}</span>
          </div>

          <div class="class-actions">
            ${link ? `<a class="join-link" href="${link}" target="_blank" rel="noopener">Open Class Link</a>` : `<button class="class-action secondary" onclick="generateMeetNotice()">Generate Meet Link</button>`}
            ${actionButtons}
          </div>
        </article>
      `;
    }).join("");

  }catch(error){
    console.error(error);
    classesList.innerHTML = '<div class="empty-state">Could not load classes. Check Firestore rules.</div>';
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if(!value("classTitle") || !value("learnerName") || !value("classDay") || !value("classTime")){
    formStatus.textContent = "Please complete the title, learner, date, and time.";
    return;
  }

  formStatus.textContent = "Saving class...";

  try{
    const assignedRoom = assignMeetRoom();

    await addDoc(collection(db, "classes"), {
      classTitle:value("classTitle"),
      learnerName:value("learnerName"),
      teacherName:value("teacherName"),
      classDate:value("classDay"),
      classTime:value("classTime"),
      duration:value("duration"),
      meetingLink: assignedRoom.url,
      roomId: assignedRoom.id,
      status:value("status") || "Scheduled",
      notes:value("notes"),

      googleCalendarEventId:"",
      googleMeetSpaceName:"",
      googleMeetConferenceRecord:"",
      startedAt:"",
      completedAt:"",
      actualDurationMinutes:"",
      reviewReason:"",

      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });

    form.reset();
    document.getElementById("status").value = "Scheduled";
    formStatus.textContent = "Class saved.";
    await loadClasses();

  }catch(error){
    console.error(error);
    formStatus.textContent = "Could not save class. Check Firestore rules.";
  }
});

loadClasses();


