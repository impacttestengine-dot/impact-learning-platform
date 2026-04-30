(function(){
  function findNameArea(){
    const all = Array.from(document.querySelectorAll("h1,h2,.hero h1,.welcome-title,[class*='welcome'],[class*='hero'] h1"));
    return all.find(el => /welcome|adelaide/i.test(el.textContent || "")) || document.querySelector("h1");
  }

  function ensureBadge(){
    let badge = document.getElementById("teacherTaskBadge");

    if(!badge){
      badge = document.createElement("span");
      badge.id = "teacherTaskBadge";
      badge.title = "Teacher tasks";
      badge.onclick = () => window.location.href="/teacher/tasks.html";
    }

    const nameArea = findNameArea();

    if(nameArea && !nameArea.contains(badge)){
      nameArea.style.display = "inline-flex";
      nameArea.style.alignItems = "center";
      nameArea.style.gap = "16px";
      nameArea.style.flexWrap = "wrap";
      nameArea.appendChild(badge);
    }
  }

  function styleBadge(pending){
    const badge = document.getElementById("teacherTaskBadge");
    if(!badge) return;

    badge.innerHTML = pending
      ? `<span class="task-dot"></span><span class="task-icon">☑</span>`
      : `<span class="task-icon">☐</span>`;

    badge.style.position = "relative";
    badge.style.right = "auto";
    badge.style.bottom = "auto";
    badge.style.zIndex = "20";
    badge.style.width = "44px";
    badge.style.height = "44px";
    badge.style.minWidth = "44px";
    badge.style.borderRadius = "50%";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.cursor = "pointer";
    badge.style.verticalAlign = "middle";
    badge.style.backdropFilter = "blur(18px)";
    badge.style.border = pending ? "1px solid rgba(245,158,11,.55)" : "1px solid rgba(255,255,255,.18)";
    badge.style.background = pending ? "rgba(245,158,11,.16)" : "rgba(255,255,255,.08)";
    badge.style.boxShadow = pending ? "0 0 28px rgba(245,158,11,.45)" : "0 14px 38px rgba(0,0,0,.3)";
    badge.style.animation = pending ? "impactTaskGlow 1.4s infinite" : "none";

    if(!document.getElementById("taskBadgeIconStyle")){
      const style = document.createElement("style");
      style.id = "taskBadgeIconStyle";
      style.textContent = `
        #teacherTaskBadge .task-icon{
          font-size:22px;
          color:rgba(255,255,255,.88);
          line-height:1;
        }

        #teacherTaskBadge .task-dot{
          position:absolute;
          top:7px;
          right:7px;
          width:9px;
          height:9px;
          border-radius:999px;
          background:#f59e0b;
          box-shadow:0 0 12px rgba(245,158,11,.9);
        }

        @keyframes impactTaskGlow{
          0%,100%{transform:scale(1);box-shadow:0 0 24px rgba(245,158,11,.32)}
          50%{transform:scale(1.08);box-shadow:0 0 42px rgba(245,158,11,.72)}
        }
      `;
      document.head.appendChild(style);
    }
  }

  async function checkPending(){
    ensureBadge();

    try{
      if(!window.firebase || !firebase.firestore){
        styleBadge(false);
        return;
      }

      const db = firebase.firestore();
      const snap = await db.collection("teacherTasks").where("status","==","pending").limit(1).get();
      styleBadge(!snap.empty);
    }catch(e){
      styleBadge(false);
    }
  }

  setTimeout(checkPending, 400);
  setTimeout(checkPending, 1200);
  setInterval(checkPending, 30000);
})();
