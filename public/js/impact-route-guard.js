(function(){
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  const path = location.pathname.toLowerCase();

  const isProtected =
    path.startsWith("/teacher/") ||
    path.startsWith("/learner/") ||
    path.startsWith("/personnel/") ||
    path.startsWith("/engine/");

  if(!isProtected) return;

  function goHome(){
    sessionStorage.clear();
    location.replace("/index.html?signin=1");
  }

  function authed(){
    return !!(
      sessionStorage.getItem("impactAccessRole") ||
      sessionStorage.getItem("impactAccessName") ||
      sessionStorage.getItem("impactPersonnelRole")
    );
  }

  function updateActivity(){
    sessionStorage.setItem("impactLastActivity", String(Date.now()));
  }

  function expired(){
    const last = Number(sessionStorage.getItem("impactLastActivity") || "0");
    if(!last) return false;
    return Date.now() - last > INACTIVITY_LIMIT;
  }

  if(!authed()){
    goHome();
    return;
  }

  if(expired()){
    goHome();
    return;
  }

  updateActivity();

  ["click","keydown","mousemove","touchstart","scroll"].forEach(evt => {
    document.addEventListener(evt, updateActivity, { passive:true });
  });

  window.addEventListener("pageshow", function(e){
    if(e.persisted || expired()){
      goHome();
    }
  });

  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "visible" && expired()){
      goHome();
    }
  });

})();
