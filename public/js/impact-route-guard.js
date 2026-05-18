(function(){
  const INACTIVITY_LIMIT = 60 * 60 * 1000;
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

  function touch(){
    sessionStorage.setItem("impactLastActivity", String(Date.now()));
  }

  function expired(){
    const last = Number(sessionStorage.getItem("impactLastActivity") || "0");
    return last && Date.now() - last > INACTIVITY_LIMIT;
  }

  if(!authed() || expired()){
    goHome();
    return;
  }

  touch();

  ["click","keydown","mousemove","touchstart","scroll"].forEach(evt=>{
    document.addEventListener(evt, touch, {passive:true});
  });

  window.addEventListener("pageshow", e=>{
    if(e.persisted || expired()) goHome();
  });

  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "visible" && expired()) goHome();
  });
})();
