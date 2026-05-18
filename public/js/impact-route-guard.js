(function(){
  const path = location.pathname.toLowerCase();

  const publicPaths = [
    "/",
    "/index.html",
    "/gate/personnel.html",
    "/gate/teachers.html",
    "/gate/learners.html",
    "/gate/learner-hub.html",
    "/gate/team-lead.html",
    "/seed-passkeys.html"
  ];

  const isProtected =
    path.startsWith("/teacher/") ||
    path.startsWith("/learner/") ||
    path.startsWith("/personnel/") ||
    path.startsWith("/engine/");

  if(!isProtected) return;
  if(publicPaths.includes(path)) return;

  function authed(){
    return !!(
      sessionStorage.getItem("impactAccessRole") ||
      sessionStorage.getItem("impactAccessName") ||
      sessionStorage.getItem("impactPersonnelRole")
    );
  }

  function allowedEntry(){
    return (
      sessionStorage.getItem("impactJustSignedIn") === "1" ||
      sessionStorage.getItem("impactInternalNav") === "1"
    );
  }

  function goHome(){
    sessionStorage.clear();
    location.replace("/index.html?signin=1");
  }

  function check(){
    if(!authed()) return goHome();
    if(!allowedEntry()) return goHome();

    sessionStorage.removeItem("impactJustSignedIn");
    sessionStorage.removeItem("impactInternalNav");
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if(!a) return;
    const href = a.getAttribute("href") || "";
    if(href.startsWith("/") && !href.startsWith("//")){
      sessionStorage.setItem("impactInternalNav","1");
    }
  }, true);

  window.addEventListener("pageshow", e => {
    if(e.persisted) goHome();
  });

  check();
})();
