/* impact-text-toolbar.js
   Fixed Google-Docs style formatting bar docked in the canvas header.
   Applies text formatting to the last-focused contenteditable, and
   align/size to the currently selected block.
   Pure ASCII only. */
(function(){

  var lastEditable = null;

  var FONTS = ["Inter","Arial","Georgia","Times New Roman","Courier New","Verdana","Trebuchet MS","Comic Sans MS"];
  var SIZES = [
    {label:"10", cmd:"1"}, {label:"13", cmd:"2"}, {label:"16", cmd:"3"},
    {label:"18", cmd:"4"}, {label:"24", cmd:"5"}, {label:"32", cmd:"6"}, {label:"48", cmd:"7"}
  ];
  var TEXT_COLORS = ["#000000","#374151","#dc2626","#ea580c","#ca8a04","#16a34a","#0891b2","#2563eb","#7c3aed","#db2777","#ffffff"];
  var HILITE_COLORS = ["transparent","#fef08a","#bbf7d0","#bfdbfe","#fbcfe8","#e9d5ff","#fed7aa","#e5e7eb"];

  function injectStyles(){
    if(document.getElementById("impact-fmtbar-styles")) return;
    var s = document.createElement("style");
    s.id = "impact-fmtbar-styles";
    s.textContent = [
      '.fmt-bar{display:flex;align-items:center;gap:3px;padding:7px 14px;background:#fff;border-bottom:1px solid #e4e7ec;flex-wrap:wrap;position:sticky;top:0;z-index:60}',
      '.fmt-btn{min-width:30px;height:30px;border-radius:7px;border:1px solid transparent;background:transparent;color:#374151;cursor:pointer;font-family:Inter,sans-serif;font-size:.82rem;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;transition:.1s}',
      '.fmt-btn:hover{background:#eef0f4}',
      '.fmt-btn.active{background:#ede9fe;color:#6d28d9;border-color:#ddd6fe}',
      '.fmt-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.fmt-sel{height:30px;border-radius:7px;border:1px solid #dde1e8;background:#fff;color:#374151;font-family:Inter,sans-serif;font-size:.76rem;font-weight:600;padding:0 6px;cursor:pointer;outline:none}',
      '.fmt-sel.font{width:118px}',
      '.fmt-sel.size{width:62px}',
      '.fmt-div{width:1px;height:20px;background:#e4e7ec;margin:0 5px}',
      '.fmt-pop{display:none;position:absolute;z-index:200;background:#fff;border:1px solid #e4e7ec;border-radius:10px;padding:8px;box-shadow:0 8px 28px rgba(0,0,0,.16);grid-template-columns:repeat(6,22px);gap:5px}',
      '.fmt-pop.show{display:grid}',
      '.fmt-swatch{width:22px;height:22px;border-radius:5px;border:1px solid rgba(0,0,0,.12);cursor:pointer}',
      '.fmt-swatch:hover{transform:scale(1.12)}',
      '.fmt-color-wrap{position:relative;display:inline-flex}',
      '.fmt-bar .fmt-label{font-size:.66rem;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0 4px 0 2px}'
    ].join("");
    document.head.appendChild(s);
  }

  function el(tag, cls, html){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  function exec(cmd, val){
    if(lastEditable){ lastEditable.focus(); }
    try{ document.execCommand(cmd, false, val === undefined ? null : val); }
    catch(e){ /* execCommand is legacy but remains the practical option for contenteditable */ }
    refreshActive();
  }

  var btnRefs = {};
  function refreshActive(){
    ["bold","italic","underline","strikeThrough"].forEach(function(c){
      if(!btnRefs[c]) return;
      var on = false;
      try{ on = document.queryCommandState(c); }catch(e){}
      btnRefs[c].classList.toggle("active", !!on);
    });
  }

  function selectedBlock(){ return document.querySelector(".c-block.selected"); }

  function buildBar(){
    injectStyles();
    var bar = el("div","fmt-bar");

    // Font family
    var fontSel = el("select","fmt-sel font");
    FONTS.forEach(function(f){
      var o = document.createElement("option");
      o.value = f; o.textContent = f; o.style.fontFamily = f;
      fontSel.appendChild(o);
    });
    fontSel.addEventListener("mousedown", function(){ /* keep selection */ });
    fontSel.addEventListener("change", function(){ exec("fontName", fontSel.value); });
    bar.appendChild(fontSel);

    // Font size
    var sizeSel = el("select","fmt-sel size");
    SIZES.forEach(function(s){
      var o = document.createElement("option");
      o.value = s.cmd; o.textContent = s.label;
      sizeSel.appendChild(o);
    });
    sizeSel.value = "3";
    sizeSel.addEventListener("change", function(){ exec("fontSize", sizeSel.value); });
    bar.appendChild(sizeSel);

    bar.appendChild(el("div","fmt-div"));

    // Bold / Italic / Underline / Strike
    [
      {cmd:"bold",          html:'<b>B</b>',              title:"Bold"},
      {cmd:"italic",        html:'<i>I</i>',              title:"Italic"},
      {cmd:"underline",     html:'<u>U</u>',              title:"Underline"},
      {cmd:"strikeThrough", html:'<s>S</s>',              title:"Strikethrough"}
    ].forEach(function(b){
      var btn = el("button","fmt-btn", b.html);
      btn.type = "button";
      btn.title = b.title;
      btn.addEventListener("mousedown", function(e){ e.preventDefault(); exec(b.cmd); });
      btnRefs[b.cmd] = btn;
      bar.appendChild(btn);
    });

    bar.appendChild(el("div","fmt-div"));

    // Text colour
    bar.appendChild(colorControl("Text colour",
      '<svg viewBox="0 0 24 24"><path d="M4 20h16"/><path d="M7 16L12 5l5 11"/><path d="M9 12h6"/></svg>',
      TEXT_COLORS, "foreColor"));

    // Highlight
    bar.appendChild(colorControl("Highlight",
      '<svg viewBox="0 0 24 24"><path d="M9 11l-4 4v3h3l4-4"/><path d="M14 6l4 4"/><path d="M12 8l4-4a2 2 0 0 1 3 3l-4 4"/></svg>',
      HILITE_COLORS, "hiliteColor"));

    bar.appendChild(el("div","fmt-div"));

    // Alignment (text)
    [
      {cmd:"justifyLeft",   d:'<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>', t:"Align left"},
      {cmd:"justifyCenter", d:'<line x1="6" y1="6" x2="18" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="18" y2="18"/>', t:"Align centre"},
      {cmd:"justifyRight",  d:'<line x1="9" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>', t:"Align right"}
    ].forEach(function(b){
      var btn = el("button","fmt-btn", '<svg viewBox="0 0 24 24">' + b.d + '</svg>');
      btn.type = "button"; btn.title = b.t;
      btn.addEventListener("mousedown", function(e){ e.preventDefault(); exec(b.cmd); });
      bar.appendChild(btn);
    });

    // Lists
    [
      {cmd:"insertUnorderedList", d:'<circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>', t:"Bulleted list"},
      {cmd:"insertOrderedList",   d:'<line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><path d="M4 5h1v4"/><path d="M3.5 15.5h2v3h-2z"/>', t:"Numbered list"}
    ].forEach(function(b){
      var btn = el("button","fmt-btn", '<svg viewBox="0 0 24 24">' + b.d + '</svg>');
      btn.type = "button"; btn.title = b.t;
      btn.addEventListener("mousedown", function(e){ e.preventDefault(); exec(b.cmd); });
      bar.appendChild(btn);
    });

    bar.appendChild(el("div","fmt-div"));

    // Block width (applies to the selected block)
    var wLabel = el("span","fmt-label","Block");
    bar.appendChild(wLabel);
    [
      {size:"small",  label:"S", t:"Narrow block"},
      {size:"medium", label:"M", t:"Medium block"},
      {size:"large",  label:"L", t:"Full width block"}
    ].forEach(function(b){
      var btn = el("button","fmt-btn", b.label);
      btn.type = "button"; btn.title = b.t;
      btn.addEventListener("mousedown", function(e){
        e.preventDefault();
        var blk = selectedBlock();
        if(!blk){ return; }
        blk.classList.remove("bw-small","bw-medium","bw-large");
        blk.classList.add("bw-" + b.size);
      });
      bar.appendChild(btn);
    });

    // Block alignment
    [
      {al:"left",   d:'<rect x="3" y="5" width="10" height="14" rx="1"/>', t:"Block left"},
      {al:"center", d:'<rect x="7" y="5" width="10" height="14" rx="1"/>', t:"Block centre"},
      {al:"right",  d:'<rect x="11" y="5" width="10" height="14" rx="1"/>', t:"Block right"}
    ].forEach(function(b){
      var btn = el("button","fmt-btn", '<svg viewBox="0 0 24 24">' + b.d + '</svg>');
      btn.type = "button"; btn.title = b.t;
      btn.addEventListener("mousedown", function(e){
        e.preventDefault();
        var blk = selectedBlock();
        if(!blk){ return; }
        blk.classList.remove("align-left","align-center","align-right");
        blk.classList.add("align-" + b.al);
      });
      bar.appendChild(btn);
    });

    bar.appendChild(el("div","fmt-div"));

    var clearBtn = el("button","fmt-btn",'<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 4h4"/><path d="M6 7l1 13h10l1-13"/></svg>');
    clearBtn.type = "button";
    clearBtn.title = "Clear formatting";
    clearBtn.addEventListener("mousedown", function(e){ e.preventDefault(); exec("removeFormat"); });
    bar.appendChild(clearBtn);

    return bar;
  }

  function colorControl(title, iconSvg, colors, cmd){
    var wrap = el("div","fmt-color-wrap");
    var btn = el("button","fmt-btn", iconSvg);
    btn.type = "button";
    btn.title = title;
    var pop = el("div","fmt-pop");

    colors.forEach(function(c){
      var sw = el("div","fmt-swatch");
      sw.style.background = (c === "transparent" ? "#fff" : c);
      if(c === "transparent"){ sw.style.backgroundImage = "linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%)"; }
      sw.title = c;
      sw.addEventListener("mousedown", function(e){
        e.preventDefault();
        exec(cmd, c === "transparent" ? "inherit" : c);
        pop.classList.remove("show");
      });
      pop.appendChild(sw);
    });

    btn.addEventListener("mousedown", function(e){
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".fmt-pop.show").forEach(function(p){ if(p !== pop) p.classList.remove("show"); });
      pop.classList.toggle("show");
      var r = btn.getBoundingClientRect();
      pop.style.left = "0px";
      pop.style.top  = (btn.offsetHeight + 5) + "px";
    });

    document.addEventListener("mousedown", function(e){
      if(!wrap.contains(e.target)) pop.classList.remove("show");
    });

    wrap.appendChild(btn);
    wrap.appendChild(pop);
    return wrap;
  }

  /* Mount the bar directly above the canvas. */
  function attach(canvasSelector){
    var canvas = document.querySelector(canvasSelector);
    if(!canvas){ console.warn("Text toolbar: canvas not found", canvasSelector); return; }

    var host = canvas.parentNode;
    var bar = buildBar();
    host.insertBefore(bar, canvas);

    canvas.addEventListener("focusin", function(e){
      var ce = e.target.closest("[contenteditable]");
      if(ce){ lastEditable = ce; refreshActive(); }
    });
    canvas.addEventListener("keyup", refreshActive);
    canvas.addEventListener("mouseup", refreshActive);
  }

  window.ImpactTextToolbar = { attach: attach };
})();