/* impact-text-toolbar.js
   Floating formatting toolbar that appears above the focused
   contenteditable element inside a builder canvas.
   Pure ASCII only. */
(function(){

  const BTNS = [
    { cmd:"bold",          label:"B",  style:"font-weight:900",             title:"Bold" },
    { cmd:"italic",        label:"I",  style:"font-style:italic",           title:"Italic" },
    { cmd:"underline",     label:"U",  style:"text-decoration:underline",   title:"Underline" },
    { sep:true },
    { size:"2",            label:"S",  title:"Small text" },
    { size:"4",            label:"M",  title:"Medium text" },
    { size:"6",            label:"L",  title:"Large text" },
    { sep:true },
    { cmd:"justifyLeft",   label:"L",  title:"Align left" },
    { cmd:"justifyCenter", label:"C",  title:"Align center" },
    { cmd:"justifyRight",  label:"R",  title:"Align right" },
    { sep:true },
    { cmd:"removeFormat",  label:"x",  title:"Clear formatting" }
  ];

  function injectStyles(){
    if(document.getElementById("impact-textbar-styles")) return;
    const s = document.createElement("style");
    s.id = "impact-textbar-styles";
    s.textContent = [
      '#impactTextBar{display:none;position:absolute;z-index:9000;background:#1e293b;border-radius:10px;padding:5px 7px;gap:2px;box-shadow:0 8px 28px rgba(0,0,0,.4);align-items:center}',
      '#impactTextBar.show{display:flex}',
      '#impactTextBar button{min-width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:#cbd5e1;font-family:Inter,sans-serif;font-size:.8rem;cursor:pointer;padding:0 6px}',
      '#impactTextBar button:hover{background:rgba(255,255,255,.14);color:#fff}',
      '#impactTextBar .tb-sep{width:1px;height:16px;background:rgba(255,255,255,.16);margin:0 3px}'
    ].join("");
    document.head.appendChild(s);
  }

  let bar = null;
  let activeEl = null;

  function buildBar(){
    if(bar) return bar;
    injectStyles();
    bar = document.createElement("div");
    bar.id = "impactTextBar";

    BTNS.forEach(function(b){
      if(b.sep){
        const d = document.createElement("div");
        d.className = "tb-sep";
        bar.appendChild(d);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.title = b.title || "";
      if(b.style) btn.setAttribute("style", b.style);
      // mousedown (not click) so the text selection is not lost
      btn.addEventListener("mousedown", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(!activeEl) return;
        activeEl.focus();
        try{
          if(b.size) document.execCommand("fontSize", false, b.size);
          else document.execCommand(b.cmd, false, null);
        }catch(err){ /* execCommand is legacy but still the practical option here */ }
      });
      bar.appendChild(btn);
    });

    document.body.appendChild(bar);
    return bar;
  }

  function positionBar(el){
    const b = buildBar();
    const r = el.getBoundingClientRect();
    b.classList.add("show");
    const bw = b.offsetWidth || 300;
    let left = r.left + window.scrollX + (r.width / 2) - (bw / 2);
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    let top = r.top + window.scrollY - b.offsetHeight - 8;
    if(top < window.scrollY + 4) top = r.bottom + window.scrollY + 8;
    b.style.left = left + "px";
    b.style.top  = top + "px";
  }

  function hideBar(){
    if(bar) bar.classList.remove("show");
    activeEl = null;
  }

  /* Attach to a canvas element. Any focused [contenteditable] inside
     it gets the toolbar. */
  function attach(canvasSelector){
    const canvas = document.querySelector(canvasSelector);
    if(!canvas) return;

    canvas.addEventListener("focusin", function(e){
      const ce = e.target.closest("[contenteditable]");
      if(!ce){ hideBar(); return; }
      activeEl = ce;
      positionBar(ce);
    });

    canvas.addEventListener("focusout", function(e){
      setTimeout(function(){
        const still = document.activeElement && document.activeElement.closest && document.activeElement.closest("[contenteditable]");
        if(!still) hideBar();
      }, 150);
    });

    canvas.addEventListener("scroll", function(){
      if(activeEl) positionBar(activeEl);
    });
    window.addEventListener("resize", function(){
      if(activeEl) positionBar(activeEl);
    });
  }

  window.ImpactTextToolbar = { attach: attach };
})();