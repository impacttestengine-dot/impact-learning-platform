(function(){
  function makeMenuLink(label, href, likeEl){
    const el = document.createElement("a");
    el.textContent = label;
    el.href = href;
    el.onclick = function(e){
      e.preventDefault();
      window.location.href = href;
    };
    el.style.display = "block";
    el.style.width = "100%";
    el.style.textAlign = "left";
    el.style.marginTop = "8px";
    el.style.padding = "12px 16px";
    el.style.borderRadius = "14px";
    el.style.color = "white";
    el.style.background = "rgba(255,255,255,.08)";
    el.style.border = "0";
    el.style.textDecoration = "none";
    el.style.fontWeight = "800";
    el.style.fontSize = ".86rem";
    return el;
  }

  function addMenuItems(){
    const all = Array.from(document.querySelectorAll("a,button,div,li"));

    const kpiItem = all.find(el => (el.textContent || "").trim() === "Team KPIs");
    if(!kpiItem || !kpiItem.parentElement) return;

    const menu = kpiItem.parentElement;

    Array.from(menu.children).forEach(el => {
      const text = (el.textContent || "").trim();
      if(text === "Tasks" || text === "Team Meetings" || text === "Recycle Bin"){
        el.remove();
      }
    });

    const teamDocs = Array.from(menu.children).find(el =>
      (el.textContent || "").trim() === "Team Docs"
    );

    if(!teamDocs){
      const reports = Array.from(menu.children).find(el =>
        (el.textContent || "").trim() === "Reports"
      );

      if(reports){
        reports.textContent = "Team Docs";
        reports.href = "/teacher/team-docs.html";
      }
    }

    const operations = Array.from(menu.children).find(el =>
      (el.textContent || "").trim() === "Operations"
    );

    if(operations){
      menu.insertBefore(makeMenuLink("Tasks","/teacher/tasks.html",kpiItem), operations);
      menu.insertBefore(makeMenuLink("Team Meetings","/teacher/team-meetings.html",kpiItem), operations.nextSibling);
      menu.appendChild(makeMenuLink("Recycle Bin","/teacher/recycle-bin.html",kpiItem));
    }else{
      menu.appendChild(makeMenuLink("Tasks","/teacher/tasks.html",kpiItem));
      menu.appendChild(makeMenuLink("Team Meetings","/teacher/team-meetings.html",kpiItem));
      menu.appendChild(makeMenuLink("Recycle Bin","/teacher/recycle-bin.html",kpiItem));
    }
  }

  setTimeout(addMenuItems,100);
  setTimeout(addMenuItems,400);
  setTimeout(addMenuItems,1000);
  setTimeout(addMenuItems,1800);
})();
