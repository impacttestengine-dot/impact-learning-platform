(function(){
  function initClassMeetTracking(){
    if(!window.firebase || !firebase.firestore){
      setTimeout(initClassMeetTracking, 700);
      return;
    }

    const db = firebase.firestore();
    const MIN_CLASS_MINUTES = 40;

    async function startClassLog(classItem){
      const now = new Date();

      const ref = await db.collection("classTracker").add({
        classId: classItem.id,
        learner: classItem.learner || "",
        teacher: classItem.teacher || "",
        level: classItem.level || "",
        day: classItem.day || "",
        time: classItem.time || "",
        duration: classItem.duration || "",
        meetRoom: classItem.meetRoom || "",
        meetUrl: classItem.meetUrl || "",
        status: "Started",
        startedAt: now.toISOString(),
        startedAtText: now.toLocaleString(),
        endedAt: "",
        endedAtText: "",
        minutesSpent: 0,
        earlyEnd: false,
        earlyEndReason: "",
        earlyEndRemark: ""
      });

      return {
        logId: ref.id,
        startedAt: now
      };
    }

    async function finishClassLog(logId, startedAt, classItem, reason, remark){
      const now = new Date();
      const minutesSpent = Math.round((now - startedAt) / 60000);
      const earlyEnd = minutesSpent < MIN_CLASS_MINUTES;

      await db.collection("classTracker").doc(logId).set({
        status: "Ended",
        endedAt: now.toISOString(),
        endedAtText: now.toLocaleString(),
        minutesSpent,
        earlyEnd,
        earlyEndReason: reason || "",
        earlyEndRemark: remark || "",
        updatedAt: now.toISOString()
      }, { merge:true });

      await db.collection("classes").doc(classItem.id).set({
        lastClassStatus: earlyEnd ? "Ended Early" : "Completed",
        lastClassStartedAt: startedAt.toISOString(),
        lastClassEndedAt: now.toISOString(),
        lastClassMinutes: minutesSpent,
        lastEarlyEndReason: reason || "",
        lastEarlyEndRemark: remark || ""
      }, { merge:true });
    }

    function showEarlyEndPrompt(card, onSubmit){
      if(card.querySelector(".early-end-box")) return;

      const box = document.createElement("div");
      box.className = "early-end-box";
      box.style.cssText = `
        grid-column:1/-1;
        margin-top:14px;
        padding:16px;
        border-radius:20px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.12);
      `;

      box.innerHTML = `
        <div style="font-weight:900;margin-bottom:10px;">Class ended before 40 minutes. Why?</div>

        <select class="early-reason" style="width:100%;margin-bottom:10px;border-radius:14px;padding:12px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.14);font-weight:800;">
          <option value="Learner did not join">Learner did not join</option>
          <option value="Teacher ended early">Teacher ended early</option>
          <option value="Internet or technical issue">Internet or technical issue</option>
          <option value="Learner emergency">Learner emergency</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Other">Other / add remark</option>
        </select>

        <textarea class="early-remark" placeholder="Add remark if needed..." style="width:100%;min-height:74px;border-radius:14px;padding:12px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.14);font-weight:800;margin-bottom:10px;"></textarea>

        <button class="early-submit" type="button" style="border:none;border-radius:14px;padding:11px 14px;background:rgba(255,255,255,.16);color:#fff;font-weight:900;cursor:pointer;">Save Reason</button>
      `;

      card.appendChild(box);

      box.querySelector(".early-submit").onclick = async () => {
        const reason = box.querySelector(".early-reason").value;
        const remark = box.querySelector(".early-remark").value.trim();

        await onSubmit(reason, remark);

        box.innerHTML = `<div style="font-weight:900;color:#d9f99d;">Reason saved ✓</div>`;
      };
    }

    document.addEventListener("click", async function(e){
      const btn = e.target.closest("[data-open-meet]");
      if(!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const encoded = btn.getAttribute("data-class");
      if(!encoded) return;

      const classItem = JSON.parse(decodeURIComponent(encoded));
      const meetUrl = classItem.meetUrl || "#";

      if(!meetUrl || meetUrl === "#"){
        alert("No Google Meet link found for this class.");
        return;
      }

      const card = btn.closest(".class-card");
      btn.textContent = "Class Started";

      const session = await startClassLog(classItem);
      const meetWindow = window.open(meetUrl, "_blank");

      const checker = setInterval(async () => {
        if(meetWindow && meetWindow.closed){
          clearInterval(checker);

          const now = new Date();
          const minutesSpent = Math.round((now - session.startedAt) / 60000);

          if(minutesSpent < MIN_CLASS_MINUTES){
            showEarlyEndPrompt(card, async (reason, remark) => {
              await finishClassLog(session.logId, session.startedAt, classItem, reason, remark);
              btn.textContent = "Open Meet";
            });
          }else{
            await finishClassLog(session.logId, session.startedAt, classItem, "", "");
            btn.textContent = "Open Meet";
          }
        }
      }, 3000);
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initClassMeetTracking);
  }else{
    initClassMeetTracking();
  }
})();
