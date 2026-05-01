(function(){
  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 11.4 12 4l8.8 7.4"/><path d="M5.8 10.6V20h4.2v-5.6h4V20h4.2v-9.4"/></svg>`,
    dashboard: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/><path d="M9 12h11"/></svg>`
  };

  function normalizeText(text){
    return (text || "").replace(/\s+/g," ").trim().toLowerCase();
  }

  function applyIcon(el,type,label){
    if(!el || el.dataset.impactIconApplied === "yes") return;

    el.dataset.impactIconApplied = "yes";
    el.classList.add("impact-icon-nav","impact-icon-" + type);
    el.setAttribute("aria-label",label);
    el.setAttribute("title",label);
    el.innerHTML = icons[type];
  }

  function run(){
    document.querySelectorAll("a,button").forEach(el=>{
      const text = normalizeText(el.textContent);
      const href = (el.getAttribute("href") || "").trim().toLowerCase();
      const title = normalizeText(el.getAttribute("title"));

      if(
        text === "⌂" ||
        text === "home" ||
        title === "home" ||
        el.classList.contains("learner-home-btn") ||
        href === "/" ||
        href === "/index.html"
      ){
        applyIcon(el,"home","Home");
        return;
      }

      if(
        text === "dashboard" ||
        title === "dashboard" ||
        href.includes("/dashboard.html")
      ){
        applyIcon(el,"dashboard","Dashboard");
        return;
      }

      if(
        text === "back" ||
        title === "back" ||
        el.classList.contains("back") ||
        el.classList.contains("back-btn")
      ){
        applyIcon(el,"back","Back");
      }
    });
  }

  document.addEventListener("DOMContentLoaded",run);
  setTimeout(run,400);
  setTimeout(run,1200);
})();
