(function () {

  function injectButtonEffects() {

    if (document.getElementById("impact-global-button-effects")) return;

    const style = document.createElement("style");
    style.id = "impact-global-button-effects";

    style.innerHTML = `
      button,
      .button,
      .btn,
      a.button,
      [role="button"]{
        transition:
          transform .14s ease,
          opacity .14s ease,
          background .18s ease,
          border-color .18s ease,
          box-shadow .18s ease !important;
      }

      button:hover,
      .button:hover,
      .btn:hover,
      a.button:hover,
      [role="button"]:hover{
        transform:translateY(-2px) scale(1.02);
        opacity:1 !important;
        box-shadow:
          0 12px 30px rgba(0,0,0,.28),
          0 0 0 1px rgba(255,255,255,.10) inset !important;
        cursor:pointer;
      }

      button:active,
      .button:active,
      .btn:active,
      a.button:active,
      [role="button"]:active{
        transform:scale(.96);
        opacity:.86 !important;
      }

      button:disabled{
        opacity:.45 !important;
        cursor:not-allowed !important;
        transform:none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function initMeetTracking(){

    if(
      !window.firebase ||
      !firebase.firestore ||
      !document.querySelector(".scheduled-class-card")
    ){
      setTimeout(initMeetTracking,600);
      return;
    }

    injectButtonEffects();

    const db = firebase.firestore();
    const MINUTES_LIMIT = 40;

    async function startLog(item){

      const startedAt = new Date();

      const ref = await db.collection("classTracker").add({
        classId:item.id || "",
        learner:item.learner || "",
        teacher:item.teacher || "",
        level:item.level || "",
        meetRoom:item.meetRoom || "",
        meetUrl:item.meetUrl || "",
        startedAt:startedAt.toISOString(),
        startedAtText:startedAt.toLocaleString(),
        endedAt:"",
        endedAtText:"",
        minutesSpent:0,
        earlyEnd:false,
        earlyEndReason:"",
        earlyEndRemark:"",
        entryType:"auto",
        billable:false,
        status:"Started"
      });

      return {
        logId:ref.id,
        startedAt
      };
    }

    async function finishLog(logId, startedAt, item, reason="", remark=""){

      const endedAt = new Date();
      const minutesSpent = Math.round((endedAt - startedAt) / 60000);
      const completed = minutesSpent >= MINUTES_LIMIT;

      await db.collection("classTracker").doc(logId).set({
        endedAt:endedAt.toISOString(),
        endedAtText:endedAt.toLocaleString(),
        minutesSpent,
        earlyEnd:!completed,
        earlyEndReason:reason,
        earlyEndRemark:remark,
        billable:completed,
        status:completed ? "Completed" : "Ended Early"
      }, { merge:true });

      await db.collection("classes").doc(item.id).set({
        lastMinutesSpent:minutesSpent,
        lastEndedAt:endedAt.toISOString(),
        lastEarlyEndReason:reason,
        lastEarlyEndRemark:remark,
        lastStatus:completed ? "Completed" : "Ended Early"
      }, { merge:true });
    }

    function showEarlyPrompt(card, callback){

      if(card.querySelector(".early-end-box")) return;

      const wrap = document.createElement("div");

      wrap.className = "early-end-box";

      wrap.style.cssText = `
        margin-top:14px;
        padding:18px;
        border-radius:22px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.12);
      `;

      wrap.innerHTML = `
        <div style="
          font-size:.95rem;
          font-weight:900;
          margin-bottom:12px;
        ">
          Why did the class end early?
        </div>

        <select class="early-select" style="
          width:100%;
          margin-bottom:12px;
          border:none;
          border-radius:16px;
          padding:14px;
          background:rgba(255,255,255,.10);
          color:white;
          font-weight:800;
        ">
          <option>Learner did not join</option>
          <option>Internet issue</option>
          <option>Teacher emergency</option>
          <option>Learner emergency</option>
          <option>Rescheduled</option>
          <option>Other</option>
        </select>

        <textarea class="early-remark" placeholder="Add remark..." style="
          width:100%;
          min-height:80px;
          border:none;
          border-radius:16px;
          padding:14px;
          background:rgba(255,255,255,.10);
          color:white;
          font-weight:700;
          resize:vertical;
        "></textarea>

        <button class="save-early-btn" type="button" style="
          margin-top:12px;
          border:none;
          border-radius:16px;
          padding:12px 18px;
          background:rgba(255,255,255,.12);
          color:white;
          font-weight:900;
        ">
          Save Reason
        </button>
      `;

      card.appendChild(wrap);

      wrap.querySelector(".save-early-btn").onclick = async () => {

        const reason = wrap.querySelector(".early-select").value;
        const remark = wrap.querySelector(".early-remark").value.trim();

        await callback(reason, remark);

        wrap.innerHTML = `
          <div style="
            font-weight:900;
            color:#bbf7d0;
          ">
            Early-end reason saved ✓
          </div>
        `;
      };
    }

    document.addEventListener("click", async function(e){

      const btn = e.target.closest("[data-open-meet]");
      if(!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const encoded = btn.getAttribute("data-open-meet");

      if(!encoded) return;

      let item;

      try{
        item = JSON.parse(decodeURIComponent(encoded));
      }catch(err){
        console.error(err);
        alert("Could not open class data.");
        return;
      }

      if(!item.meetUrl){
        alert("No Google Meet link found.");
        return;
      }

      btn.innerText = "Opening...";
      btn.disabled = true;

      const tracker = await startLog(item);

      const win = window.open(
        item.meetUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if(!win){
        btn.disabled = false;
        btn.innerText = "Open Meet";
        alert("Popup blocked. Allow popups for this site.");
        return;
      }

      btn.innerText = "Class Running";

      const card = btn.closest(".scheduled-class-card") || btn.closest(".class-card");

      const watch = setInterval(async () => {

        if(win.closed){

          clearInterval(watch);

          const minutesSpent = Math.round(
            (new Date() - tracker.startedAt) / 60000
          );

          if(minutesSpent < MINUTES_LIMIT){

            showEarlyPrompt(card, async (reason, remark) => {

              await finishLog(
                tracker.logId,
                tracker.startedAt,
                item,
                reason,
                remark
              );

              btn.disabled = false;
              btn.innerText = "Open Meet";
            });

          } else {

            await finishLog(
              tracker.logId,
              tracker.startedAt,
              item
            );

            btn.disabled = false;
            btn.innerText = "Open Meet";
          }
        }

      }, 3000);

    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initMeetTracking);
  }else{
    initMeetTracking();
  }

})();

