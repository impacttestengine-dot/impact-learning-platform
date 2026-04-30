(function(){
  function addTaskMenuItem(){
    const menuItems = Array.from(document.querySelectorAll("a,button,div,li"));
    const existingTasks = menuItems.filter(el => (el.textContent || "").trim() === "Tasks");

    existingTasks.slice(1).forEach(el => el.remove());

    if(existingTasks.length > 0) return;

    const kpiItem = menuItems.find(el => (el.textContent || "").trim() === "Team KPIs");
    if(!kpiItem || !kpiItem.parentElement) return;

    const task = document.createElement(kpiItem.tagName.toLowerCase() === "button" ? "button" : "a");
    task.textContent = "Tasks";
    task.href = "/teacher/tasks.html";
    task.onclick = function(){ window.location.href="/teacher/tasks.html"; };
    task.style.display = "block";
    task.style.width = "100%";
    task.style.textAlign = "left";
    task.style.marginTop = "8px";
    task.style.padding = "12px 16px";
    task.style.borderRadius = "14px";
    task.style.color = "white";
    task.style.background = "rgba(255,255,255,.08)";
    task.style.border = "0";
    task.style.textDecoration = "none";
    task.style.fontWeight = "800";

    kpiItem.parentElement.insertBefore(task, kpiItem.nextSibling);
  }

  setTimeout(addTaskMenuItem, 300);
  setTimeout(addTaskMenuItem, 1000);
})();
