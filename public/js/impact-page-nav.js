(function(){
  const path = window.location.pathname.toLowerCase();

  const isHome = path === "/" || path.endsWith("/index.html");
  const isGate = path.includes("/gate/");
  const isDashboard =
    path.endsWith("/teacher/dashboard.html") ||
    path.endsWith("/learner/dashboard.html") ||
    path.endsWith("/personnel/dashboard.html");

  const isAppPage =
    path.includes("/teacher/") ||
    path.includes("/learner/") ||
    path.includes("/personnel/") ||
    path.includes("/engine/") ||
    path.includes("/admin/");

  if (isHome || isGate || isDashboard || !isAppPage) return;

  document.querySelectorAll(".impact-dashboard-btn,.impact-back-btn").forEach(el => el.remove());

  const dashboardUrl = path.includes("/learner/")
    ? "/learner/dashboard.html"
    : "/teacher/dashboard.html";

  const dash = document.createElement("a");
  dash.className = "impact-dashboard-btn";
  dash.href = dashboardUrl;
  dash.textContent = "Dashboard";
  document.body.appendChild(dash);

  const back = document.createElement("button");
  back.className = "impact-back-btn";
  back.type = "button";
  back.textContent = "Back";
  back.onclick = function(){
    if(history.length > 1) history.back();
    else location.href = dashboardUrl;
  };
  document.body.appendChild(back);
})();
