(function(){
  const icons = {
    home:'<svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M6 10.6V20h4.2v-5.4h3.6V20H18v-9.4"/></svg>',
    dashboard:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
    back:'<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12 15 18.5"/><path d="M9 12h11"/></svg>'
  };

  function text(el){return (el.textContent||"").trim().toLowerCase();}
  function href(el){return (el.getAttribute("href")||"").trim().toLowerCase();}
  function title(el){return (el.getAttribute("title")||"").trim().toLowerCase();}

  function make(el,type,label){
    if(!el || el.dataset.impactIconDone==="yes") return;
    el.dataset.impactIconDone="yes";
    el.classList.add("impact-round-icon");
    el.title=label;
    el.setAttribute("aria-label",label);
    el.innerHTML=icons[type];
  }

  function run(){
    document.querySelectorAll("a,button").forEach(function(el){
      const t=text(el), h=href(el), ti=title(el);

      if(t==="home" || t==="⌂" || ti==="home" || h==="/" || h==="/index.html"){
        make(el,"home","Home");
      }

      if(t==="dashboard" || ti==="dashboard" || h.indexOf("dashboard")>-1){
        make(el,"dashboard","Dashboard");
      }

      if(t==="back" || ti==="back"){
        make(el,"back","Back");
      }
    });
  }

  document.addEventListener("DOMContentLoaded",run);
  setTimeout(run,600);
})();
