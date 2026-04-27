(function(){
  const path = window.location.pathname.toLowerCase();

  const isDashboard =
    path.endsWith("/teacher/dashboard.html") ||
    path.endsWith("/personnel/dashboard.html") ||
    path.endsWith("/learner/dashboard.html");

  // Dashboard controls are handled manually inside dashboard pages.
  // Do not inject anything there.
  if (isDashboard) {
    document.querySelectorAll(
      ".impact-nav-btn,.impact-top-btn,.impact-dashboard-btn,.impact-back-btn,.impact-home-btn,.impact-left-btn,.impact-right-btn"
    ).forEach(el => el.remove());
    return;
  }

  // Global shell button injection disabled for now.
  // Background is handled by impact-global-bg.js.
})();
