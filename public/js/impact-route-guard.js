(function(){
  const PLACEHOLDER = "/placeholder.html";

  const textRoutes = {
    "learner records": "/teacher/records.html",
    "records": "/teacher/records.html",
    "lesson plans": "/teacher/lesson-plans.html",
    "classes": "/teacher/classes.html",
    "recordings": "/teacher/recordings.html",
    "activities": "/teacher/exercises.html",
    "activity": "/teacher/exercises.html",
    "delf exam mocks": "/teacher/delf-mocks.html",
    "delf": "/teacher/delf-mocks.html",
    "progress": "/teacher/progress.html",
    "configuration": "/teacher/configuration.html",
    "reports": "/teacher/reports.html",
    "operations": "/teacher/operations.html",
    "team kpis": "/teacher/kpis.html",
    "academic calendar": "/teacher/academic-calendar.html",
    "dashboard": "/teacher/dashboard.html",
    "back": "__BACK__",

    "create folder": "/placeholder.html?title=Create%20Folder&module=Activities",
    "create activity": "/teacher/activity-builder.html",
    "activity tracker": "/teacher/activity-tracker.html",
    "preview exercises": "/teacher/preview-exercises.html",
    "create lesson plan": "/teacher/lesson-builder.html",
    "create lesson": "/teacher/lesson-builder.html",
    "tracker": "/placeholder.html?title=Tracker&module=Lesson%20Plans",
    "view": "/placeholder.html?title=View%20Mode&module=Workspace",
    "edit": "/placeholder.html?title=Edit%20Mode&module=Workspace",
    "new": "/placeholder.html?title=New%20Document&module=Workspace",
    "save": "/placeholder.html?title=Save&module=Workspace"
  };

  function cleanText(el){
    return String(el.textContent || el.value || el.getAttribute("aria-label") || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g," ");
  }

  function placeholderUrl(label){
    return PLACEHOLDER + "?title=" + encodeURIComponent(label || "Coming Soon");
  }

  function resolveFromText(text){
    if(!text) return "";

    if(textRoutes[text]) return textRoutes[text];

    const key = Object.keys(textRoutes).find(k => text.includes(k));
    return key ? textRoutes[key] : "";
  }

  function safeGo(url, label){
    if(url === "__BACK__"){
      history.back();
      return;
    }

    if(!url || url === "#" || url.startsWith("javascript:")){
      location.href = placeholderUrl(label);
      return;
    }

    location.href = url;
  }

  function fixAnchors(){
    document.querySelectorAll("a").forEach(a => {
      const text = cleanText(a);
      const href = a.getAttribute("href") || "";
      const resolved = resolveFromText(text);

      if(resolved && (href === "#" || href === "" || href.startsWith("javascript:"))){
        a.setAttribute("href", resolved);
      }

      if(!href || href === "#" || href.startsWith("javascript:")){
        a.addEventListener("click", function(e){
          e.preventDefault();
          safeGo(resolved || "", text || "Coming Soon");
        });
      }
    });
  }

  function fixButtons(){
    document.querySelectorAll("button").forEach(btn => {
      if(btn.dataset.impactRouteBound === "yes") return;

      const text = cleanText(btn);
      const resolved = resolveFromText(text);

      const hasInline = btn.getAttribute("onclick");
      const isSubmit = String(btn.type || "").toLowerCase() === "submit";

      if(hasInline || isSubmit) return;

      if(resolved || text){
        btn.dataset.impactRouteBound = "yes";

        btn.addEventListener("click", function(e){
          const shouldFallback =
            !resolved &&
            !btn.id &&
            !btn.closest("form");

          if(resolved){
            e.preventDefault();
            safeGo(resolved, text);
          }else if(shouldFallback){
            e.preventDefault();
            safeGo("", text || "Coming Soon");
          }
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    fixAnchors();
    fixButtons();
  });
})();
