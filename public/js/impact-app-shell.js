(function(){
  const path = window.location.pathname.toLowerCase();

  const isHome = path === "/" || path.endsWith("/index.html");
  const isGate = path.includes("/gate/");
  const isDashboard = path.endsWith("/teacher/dashboard.html") || path.endsWith("/learner/dashboard.html");

  if (isHome || isGate) return;

  const isPersonnelOrLearner =
    path.includes("/teacher/") ||
    path.includes("/personnel/") ||
    path.includes("/learner/") ||
    path.includes("/engine/");

  if (!isPersonnelOrLearner) return;

  if (!isDashboard && !document.querySelector(".impact-dashboard-btn")) {
    const dash = document.createElement("a");
    dash.className = "impact-top-btn impact-dashboard-btn";
    dash.href = path.includes("/learner/") ? "/learner/dashboard.html" : "/teacher/dashboard.html";
    dash.textContent = "Dashboard";
    document.body.appendChild(dash);
  }

  if (!isDashboard && !document.querySelector(".impact-back-btn")) {
    const back = document.createElement("button");
    back.className = "impact-top-btn impact-back-btn";
    back.type = "button";
    back.textContent = "Back";
    back.addEventListener("click", function(){
      if (history.length > 1) history.back();
      else window.location.href = path.includes("/learner/") ? "/learner/dashboard.html" : "/teacher/dashboard.html";
    });
    document.body.appendChild(back);
  }
})();
