(function(){
  function makeMenuLink(label, href, likeEl){
    const el = document.createElement(likeEl && likeEl.tagName.toLowerCase() === "button" ? "button" : "a");
    el.textContent = label;
    el.href = href;
    el.onclick = function(){ window.location.href = href; };
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
    return el;
  }

  function addMenuItems(){
    const menuItems = Array.from(document.querySelectorAll("a,button,div,li"));

    const existingTasks = menuItems.filter(el => (el.textContent || "").trim() === "Tasks");
    existingTasks.slice(1).forEach(el => el.remove());

    const existingBin = menuItems.filter(el => (el.textContent || "").trim() === "Recycle Bin");
    existingBin.slice(1).forEach(el => el.remove());

    const kpiItem = menuItems.find(el => (el.textContent || "").trim() === "Team KPIs");
    if(!kpiItem || !kpiItem.parentElement) return;

    if(!existingTasks.length){
      kpiItem.parentElement.insertBefore(makeMenuLink("Tasks","/teacher/tasks.html",kpiItem), kpiItem.nextSibling);
    }

    if(!existingBin.length){
      kpiItem.parentElement.appendChild(makeMenuLink("Recycle Bin","/teacher/recycle-bin.html",kpiItem));
    }
  }

  setTimeout(addMenuItems,300);
  setTimeout(addMenuItems,1000);
})();
