/* impact-cover.js v2 - shared Cover Page block with design toolbar and background image */
(function(){
  if(window.ImpactCover) return;

  var COLLECTION = "coverTemplates";
  var PH = { org:"Organisation name", label:"Document type", title:"Document title", subtitle:"Subtitle (optional)", level:"Level", teacher:"Teacher", date:"Date" };
  var META = [];
  var META_LABEL = { level:"Level", teacher:"Teacher", date:"Date" };
  var SAVED = {};
  var BG_LIMIT = 350000;

  var FONTS = [
    ["Inter","Inter, Arial, sans-serif"],
    ["Arial","Arial, Helvetica, sans-serif"],
    ["Georgia","Georgia, serif"],
    ["Times New Roman","'Times New Roman', Times, serif"],
    ["Courier New","'Courier New', monospace"],
    ["Playfair Display","'Playfair Display', Georgia, serif"],
    ["Merriweather","Merriweather, Georgia, serif"],
    ["Lora","Lora, Georgia, serif"],
    ["Montserrat","Montserrat, Arial, sans-serif"],
    ["Poppins","Poppins, Arial, sans-serif"],
    ["Raleway","Raleway, Arial, sans-serif"],
    ["Oswald","Oswald, Impact, sans-serif"],
    ["Bebas Neue","'Bebas Neue', Impact, sans-serif"],
    ["Dancing Script","'Dancing Script', cursive"],
    ["Great Vibes","'Great Vibes', cursive"],
    ["Pacifico","Pacifico, cursive"]
  ];
  var SWATCHES = ["#FFFFFF","#000000","#1F2430","#6B7280","#B5654A","#C9A227","#1E3A8A","#166534","#B91C1C","#7C3AED"];
  var FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@400;700;800&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Montserrat:wght@400;700;800&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&display=swap";

  var CSS = [
    '.ic-cover{position:relative;overflow:hidden;background:#fff;color:#1f2430;border:1px solid #e5e7eb;border-top:6px solid #B5654A;border-radius:14px;padding:44px 36px;text-align:center;font-family:Inter,Arial,sans-serif;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-sizing:border-box;width:100%}',
    '.ic-bg{position:absolute;top:0;right:0;bottom:0;left:0;background-size:cover;background-position:center;z-index:0}',
    '.ic-shade{position:absolute;top:0;right:0;bottom:0;left:0;z-index:0;pointer-events:none}',
    '.ic-cover > *:not(.ic-bg):not(.ic-shade){position:relative;z-index:1}',
    '.ic-logo{max-height:84px;max-width:240px;object-fit:contain;display:block}',
    '.ic-org{font-size:1.05rem;font-weight:800;letter-spacing:.32em;color:#B5654A;text-transform:uppercase}',
    '.ic-rule{width:64px;height:3px;background:#B5654A;border-radius:2px;margin:4px 0}',
    '.ic-label{font-size:.78rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6b7280}',
    '.ic-title{font-size:2rem;font-weight:800;line-height:1.2;color:#1f2430}',
    '.ic-subtitle{font-size:1.05rem;color:#4b5563}',
    '.ic-meta{display:flex;gap:28px;flex-wrap:wrap;justify-content:center;margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;width:100%;max-width:560px}',
    '.ic-meta-item{display:flex;flex-direction:column;gap:2px;min-width:90px;align-items:center}',
    '.ic-meta-k{font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;font-weight:700}',
    '.ic-meta-v{font-size:.95rem;font-weight:600;color:#1f2430}',
    '.ic-cover [contenteditable]{outline:none;min-width:60px;border-radius:6px;padding:2px 6px}',
    '.ic-cover [contenteditable]:hover{background:rgba(181,101,74,.07)}',
    '.ic-cover [contenteditable]:focus{background:rgba(181,101,74,.12)}',
    '.ic-cover [contenteditable]:empty:before{content:attr(data-ph);color:#c4c8d0;font-weight:500;letter-spacing:normal;text-transform:none}',
    '.ic-cover [data-field].ic-active{outline:2px solid #B5654A;outline-offset:2px}',
    '.ic-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
    '.ic-btn{padding:7px 14px;border-radius:9px;border:1.5px solid #d1d5db;background:#fff;color:#374151;font-size:.78rem;font-weight:700;cursor:pointer;font-family:Inter,Arial,sans-serif}',
    '.ic-btn:hover{border-color:#B5654A;color:#B5654A}',
    '.ic-btn.on{background:#B5654A;border-color:#B5654A;color:#fff}',
    '.ic-btn-primary{background:#B5654A;border-color:#B5654A;color:#fff}',
    '.ic-btn-primary:hover{color:#fff;opacity:.9}',
    '.ic-bar{border:1.5px solid #e5e7eb;border-radius:12px;background:#fff;padding:10px 12px;margin-bottom:10px;display:flex;flex-direction:column;gap:10px;font-family:Inter,Arial,sans-serif}',
    '.ic-bar-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.ic-bar-label{font-size:.72rem;font-weight:700;color:#6b7280;letter-spacing:.04em;margin-right:4px}',
    '.ic-bar select,.ic-bar input[type=number]{padding:6px 8px;border:1.5px solid #d1d5db;border-radius:8px;font-size:.8rem;font-family:Inter,Arial,sans-serif;color:#1f2430;background:#fff}',
    '.ic-bar input[type=number]{width:66px}',
    '.ic-bar input[type=color]{width:34px;height:30px;padding:0;border:1.5px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer}',
    '.ic-bar input[type=range]{width:120px}',
    '.ic-sw{width:22px;height:22px;border-radius:50%;border:1.5px solid #d1d5db;cursor:pointer;padding:0}',
    '.ic-sw:hover{transform:scale(1.15)}',
    '.ic-off{opacity:.45;pointer-events:none}',
    '.ic-chooser{border:2px dashed #d1d5db;border-radius:14px;padding:28px;text-align:center;background:#fafafa;font-family:Inter,Arial,sans-serif}',
    '.ic-chooser-title{font-size:1.05rem;font-weight:800;color:#1f2430}',
    '.ic-chooser-sub{font-size:.84rem;color:#6b7280;margin:6px 0 16px}',
    '.ic-chooser-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.ic-saved-list{margin-top:16px;text-align:left;display:flex;flex-direction:column;gap:8px}',
    '.ic-saved-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fff;cursor:pointer}',
    '.ic-saved-item:hover{border-color:#B5654A}',
    '.ic-saved-name{font-size:.88rem;font-weight:700;color:#1f2430}',
    '.ic-saved-del{border:none;background:transparent;color:#9ca3af;font-size:.9rem;cursor:pointer;padding:2px 8px}',
    '.ic-saved-del:hover{color:#dc2626}',
    '.ic-saved-empty{font-size:.82rem;color:#6b7280;text-align:center;padding:8px}'
  ].join("");

  function injectCss(){
    if(document.getElementById("ic-cover-style")) return;
    var s = document.createElement("style");
    s.id = "ic-cover-style";
    s.textContent = CSS;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_URL;
    var h = document.head || document.documentElement;
    h.appendChild(l);
    h.appendChild(s);
  }
  injectCss();

  function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function escA(s){ return esc(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function safeImg(src){
    return (typeof src === "string" && /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+\/=]+$/.test(src)) ? src : "";
  }
  function fontStack(name){
    for(var i = 0; i < FONTS.length; i++){ if(FONTS[i][0] === name) return FONTS[i][1]; }
    return "";
  }
  function cleanStyle(st){
    var o = {};
    if(!st || typeof st !== "object") return o;
    if(typeof st.font === "string" && fontStack(st.font)) o.font = st.font;
    var n = parseInt(st.size, 10);
    if(n >= 8 && n <= 120) o.size = n;
    if(typeof st.color === "string" && /^#[0-9a-fA-F]{6}$/.test(st.color)) o.color = st.color;
    if(st.bold === "1" || st.bold === "0") o.bold = st.bold;
    if(st.italic === "1" || st.italic === "0") o.italic = st.italic;
    return o;
  }
  function cleanStyles(map){
    var out = {};
    if(!map || typeof map !== "object") return out;
    Object.keys(PH).forEach(function(k){
      var s = cleanStyle(map[k]);
      if(Object.keys(s).length) out[k] = s;
    });
    return out;
  }
  function cleanBg(b){
    var src = safeImg(b && b.src);
    var sh = parseInt(b && b.shade, 10);
    if(!(sh >= 0)) sh = 0;
    if(sh > 80) sh = 80;
    return { src:src, shade: src ? sh : 0 };
  }
  function styleCss(o){
    var c = "";
    var f = fontStack(o.font);
    if(f) c += "font-family:" + f + ";";
    if(o.size) c += "font-size:" + o.size + "px;";
    if(o.color) c += "color:" + o.color + ";";
    if(o.bold === "1") c += "font-weight:700;";
    if(o.bold === "0") c += "font-weight:400;";
    if(o.italic === "1") c += "font-style:italic;";
    if(o.italic === "0") c += "font-style:normal;";
    return c;
  }
  function attrsFor(o){
    if(!o || !Object.keys(o).length) return "";
    var a = "";
    ["font","size","color","bold","italic"].forEach(function(k){ if(o[k] !== undefined) a += ' data-' + k + '="' + escA(o[k]) + '"'; });
    var css = styleCss(o);
    if(css) a += ' style="' + escA(css) + '"';
    return a;
  }
  function viewStyleAttr(o){
    var css = o ? styleCss(o) : "";
    return css ? ' style="' + escA(css) + '"' : "";
  }
  function readAttrs(el){
    return cleanStyle({
      font:el.getAttribute("data-font"), size:el.getAttribute("data-size"), color:el.getAttribute("data-color"),
      bold:el.getAttribute("data-bold"), italic:el.getAttribute("data-italic")
    });
  }
  function applyField(el){
    var css = styleCss(readAttrs(el));
    if(css) el.setAttribute("style", css); else el.removeAttribute("style");
  }
  function setAttr(el, name, val){
    if(val === "" || val == null) el.removeAttribute("data-" + name);
    else el.setAttribute("data-" + name, String(val));
    applyField(el);
  }
  function rgbToHex(s){
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(String(s || ""));
    if(!m) return "#000000";
    function h(n){ var x = Math.max(0, Math.min(255, parseInt(n, 10))).toString(16); return x.length < 2 ? "0" + x : x; }
    return "#" + h(m[1]) + h(m[2]) + h(m[3]);
  }

  function docLabel(){
    var t = String(document.title || "").toLowerCase();
    if(t.indexOf("delf") >= 0) return "DELF Mock Exam";
    if(t.indexOf("lesson") >= 0) return "Lesson Plan";
    if(t.indexOf("activity") >= 0) return "Activity";
    return "";
  }
  function today(){
    var m = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var d = new Date();
    return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear();
  }
  function whoAmI(){
    try{ return sessionStorage.getItem("impactAccessName") || sessionStorage.getItem("impactPersonnelName") || ""; }
    catch(e){ return ""; }
  }
  function autofill(){
    var t = document.getElementById("lessonTitle") || document.getElementById("mockTitle");
    var l = document.getElementById("lessonLevel") || document.getElementById("mockLevel");
    return {
      org:"IMPACT", label:docLabel(),
      title:t ? esc(String(t.value || "").trim()) : "",
      subtitle:"", level:l ? esc(l.value) : "", teacher:esc(whoAmI()), date:today()
    };
  }

  function fieldEl(k, val, cls, st){
    return '<div class="' + cls + '" data-field="' + k + '" data-ph="' + PH[k] + '" contenteditable="true"' + attrsFor(st) + '>' + (val || "") + '</div>';
  }
  function bgHtml(bg){
    if(!bg || !bg.src) return "";
    return '<div class="ic-bg" style="background-image:url(\'' + bg.src + '\')"></div>'
      + '<div class="ic-shade" data-shade="' + bg.shade + '" style="background:rgba(0,0,0,' + (bg.shade / 100) + ')"></div>';
  }
  function barHtml(bg){
    var fonts = '<option value="">Default font</option>' + FONTS.map(function(x){
      return '<option value="' + escA(x[0]) + '" style="font-family:' + escA(x[1]) + '">' + esc(x[0]) + '</option>';
    }).join("");
    var sw = SWATCHES.map(function(c){
      return '<button type="button" class="ic-sw" data-ic="swatch" data-color="' + c + '" title="' + c + '" style="background:' + c + '"></button>';
    }).join("");
    var h = '<div class="ic-bar">';
    h += '<div class="ic-bar-row ic-textrow ic-off">'
      + '<span class="ic-bar-label ic-bar-target">Click a text field on the cover to style it</span>'
      + '<select data-ics="font" title="Font">' + fonts + '</select>'
      + '<input type="number" data-ics="size" min="8" max="120" placeholder="Size" title="Font size (px)">'
      + '<input type="color" data-ics="color" value="#000000" title="Text colour">'
      + sw
      + '<button type="button" class="ic-btn" data-ic="bold" style="font-weight:800">B</button>'
      + '<button type="button" class="ic-btn" data-ic="italic" style="font-style:italic">I</button>'
      + '<button type="button" class="ic-btn" data-ic="reset-style">Reset field</button>'
      + '</div>';
    h += '<div class="ic-bar-row">'
      + '<span class="ic-bar-label">Background</span>'
      + '<button type="button" class="ic-btn" data-ic="bg">' + (bg && bg.src ? "Change image" : "Add image") + '</button>'
      + (bg && bg.src ? '<button type="button" class="ic-btn" data-ic="bg-rm">Remove image</button><span class="ic-bar-label">Darken</span><input type="range" min="0" max="80" value="' + bg.shade + '" data-ics="shade" title="Darken background">' : '')
      + '<input type="file" class="ic-bg-input" accept="image/*" style="display:none">'
      + '</div>';
    h += '</div>';
    return h;
  }
  function editorHtml(f, logo, styles, bg){
    f = f || {};
    styles = cleanStyles(styles);
    bg = cleanBg(bg);
    var lg = safeImg(logo);
    var h = '<div class="ic-controls">'
      + '<button type="button" class="ic-btn" data-ic="logo">' + (lg ? "Change logo" : "Add logo") + '</button>'
      + (lg ? '<button type="button" class="ic-btn" data-ic="logo-rm">Remove logo</button>' : '')
      + '<button type="button" class="ic-btn" data-ic="save-tpl">Save as template</button>'
      + '<button type="button" class="ic-btn" data-ic="change">Change cover</button>'
      + '<input type="file" class="ic-logo-input" accept="image/*" style="display:none">'
      + '</div>';
    h += barHtml(bg);
    h += '<div class="ic-cover">' + bgHtml(bg);
    if(lg) h += '<img class="ic-logo" src="' + lg + '" alt="">';
    h += fieldEl("org", f.org, "ic-org", styles.org);
    h += '<div class="ic-rule"></div>';
    h += fieldEl("label", f.label, "ic-label", styles.label);
    h += fieldEl("title", f.title, "ic-title", styles.title);
    h += fieldEl("subtitle", f.subtitle, "ic-subtitle", styles.subtitle);
    if(META.length) h += '<div class="ic-meta">';
    META.forEach(function(k){
      h += '<div class="ic-meta-item"><div class="ic-meta-k">' + META_LABEL[k] + '</div>' + fieldEl(k, f[k], "ic-meta-v", styles[k]) + '</div>';
    });
    h += (META.length ? '</div></div>' : '</div>');
    return h;
  }
  function chooserHtml(){
    return '<div class="ic-chooser">'
      + '<div class="ic-chooser-title">Cover page</div>'
      + '<div class="ic-chooser-sub">Start from a saved cover, or create a new one.</div>'
      + '<div class="ic-chooser-btns">'
      + '<button type="button" class="ic-btn ic-btn-primary" data-ic="new">Create cover</button>'
      + '<button type="button" class="ic-btn" data-ic="saved">Select saved cover</button>'
      + '</div>'
      + '<div class="ic-saved-list" style="display:none"></div>'
      + '</div>';
  }
  function viewHtml(b){
    if(!b || b.mode !== "editor") return "";
    var f = b.fields || {};
    var styles = cleanStyles(b.styles);
    var bg = cleanBg(b.bg);
    var lg = safeImg(b.logo);
    function one(k, cls){ return f[k] ? '<div class="' + cls + '"' + viewStyleAttr(styles[k]) + '>' + f[k] + '</div>' : ""; }
    var meta = "";
    META.forEach(function(k){
      if(f[k]) meta += '<div class="ic-meta-item"><div class="ic-meta-k">' + META_LABEL[k] + '</div><div class="ic-meta-v"' + viewStyleAttr(styles[k]) + '>' + f[k] + '</div></div>';
    });
    return '<div class="ic-cover">' + bgHtml(bg)
      + (lg ? '<img class="ic-logo" src="' + lg + '" alt="">' : '')
      + one("org","ic-org")
      + '<div class="ic-rule"></div>'
      + one("label","ic-label")
      + one("title","ic-title")
      + one("subtitle","ic-subtitle")
      + (meta ? '<div class="ic-meta">' + meta + '</div>' : '')
      + '</div>';
  }

  function template(){
    return { render:function(data){
      if(data && data.mode === "editor") return editorHtml(data.fields, data.logo, data.styles, data.bg);
      return chooserHtml();
    }};
  }
  function extract(block){
    var cover = block.querySelector(".ic-cover");
    if(!cover) return { mode:"choose" };
    var f = {}, st = {};
    Object.keys(PH).forEach(function(k){
      var el = cover.querySelector('[data-field="' + k + '"]');
      f[k] = el ? el.innerHTML : "";
      if(el){ var s = readAttrs(el); if(Object.keys(s).length) st[k] = s; }
    });
    var img = cover.querySelector(".ic-logo");
    var bgEl = cover.querySelector(".ic-bg");
    var shEl = cover.querySelector(".ic-shade");
    var src = "";
    if(bgEl){
      var m = /url\((?:'|")?([^'")]+)(?:'|")?\)/.exec(bgEl.getAttribute("style") || "");
      src = m ? m[1] : "";
    }
    var bg = cleanBg({ src:src, shade: shEl ? shEl.getAttribute("data-shade") : 0 });
    return { mode:"editor", fields:f, logo: img ? safeImg(img.getAttribute("src")) : "", styles:st, bg:bg };
  }
  function setInner(block, html){
    var inner = block.querySelector(".c-block-inner");
    block._icActive = null;
    if(inner) inner.innerHTML = html;
  }
  function rebuild(block, patch){
    var c = extract(block);
    if(c.mode !== "editor") return;
    setInner(block, editorHtml(
      patch.fields || c.fields,
      patch.logo !== undefined ? patch.logo : c.logo,
      patch.styles || c.styles,
      patch.bg !== undefined ? patch.bg : c.bg
    ));
  }

  function syncBar(block){
    var f = block._icActive;
    var bar = block.querySelector(".ic-bar");
    if(!bar || !f || !block.contains(f)) return;
    var row = bar.querySelector(".ic-textrow");
    row.classList.remove("ic-off");
    bar.querySelector(".ic-bar-target").textContent = "Styling: " + (PH[f.getAttribute("data-field")] || "field");
    var cs = window.getComputedStyle(f);
    bar.querySelector('[data-ics="font"]').value = f.getAttribute("data-font") || "";
    bar.querySelector('[data-ics="size"]').value = f.getAttribute("data-size") || String(Math.round(parseFloat(cs.fontSize)) || "");
    bar.querySelector('[data-ics="color"]').value = f.getAttribute("data-color") || rgbToHex(cs.color);
    var bb = bar.querySelector('[data-ic="bold"]');
    var ib = bar.querySelector('[data-ic="italic"]');
    if(parseInt(cs.fontWeight, 10) >= 600) bb.classList.add("on"); else bb.classList.remove("on");
    if(cs.fontStyle === "italic") ib.classList.add("on"); else ib.classList.remove("on");
  }
  function activeField(block){
    var f = block._icActive;
    return (f && block.contains(f)) ? f : null;
  }

  function toggleSaved(block){
    var list = block.querySelector(".ic-saved-list");
    if(!list) return;
    if(list.style.display !== "none"){ list.style.display = "none"; return; }
    list.style.display = "flex";
    list.innerHTML = '<div class="ic-saved-empty">Loading saved covers...</div>';
    if(typeof firebase === "undefined"){
      list.innerHTML = '<div class="ic-saved-empty">Could not reach the cover library.</div>';
      return;
    }
    firebase.firestore().collection(COLLECTION).get().then(function(snap){
      var items = [];
      snap.forEach(function(d){ var x = d.data(); x.id = d.id; SAVED[d.id] = x; items.push(x); });
      items.sort(function(a,b){ return String(a.name || "").localeCompare(String(b.name || "")); });
      if(!items.length){
        list.innerHTML = '<div class="ic-saved-empty">No saved covers yet. Create one and use Save as template.</div>';
        return;
      }
      list.innerHTML = items.map(function(x){
        return '<div class="ic-saved-item" data-ic="pick" data-id="' + escA(x.id) + '"><span class="ic-saved-name">' + esc(x.name || "Untitled cover") + '</span><button type="button" class="ic-saved-del" data-ic="del-tpl" data-id="' + escA(x.id) + '" title="Delete">x</button></div>';
      }).join("");
    }).catch(function(err){
      list.innerHTML = '<div class="ic-saved-empty">Could not load covers: ' + esc(err.message) + '</div>';
    });
  }
  function pickSaved(block, id){
    var t = SAVED[id];
    if(!t) return;
    var base = autofill();
    var tf = t.fields || {};
    ["org","subtitle","teacher"].forEach(function(k){ if(tf[k]) base[k] = tf[k]; });
    setInner(block, editorHtml(base, t.logo, t.styles, t.bg));
  }
  function deleteSaved(btn){
    var id = btn.getAttribute("data-id");
    if(!id || !window.confirm("Delete this saved cover for everyone?")) return;
    firebase.firestore().collection(COLLECTION).doc(id).delete().then(function(){
      delete SAVED[id];
      var row = btn.closest(".ic-saved-item");
      if(row) row.remove();
    }).catch(function(err){ window.alert("Could not delete: " + err.message); });
  }
  function saveTemplate(block){
    var c = extract(block);
    if(c.mode !== "editor") return;
    var name = window.prompt("Name this cover template:");
    if(!name || !name.trim()) return;
    if(typeof firebase === "undefined"){ window.alert("Could not reach the cover library."); return; }
    firebase.firestore().collection(COLLECTION).add({
      name:name.trim(), fields:c.fields, logo:c.logo || "", styles:c.styles || {}, bg:c.bg || { src:"", shade:0 },
      createdBy:whoAmI(), createdAt:new Date().toISOString()
    }).then(function(){
      window.alert("Cover template saved.");
    }).catch(function(err){ window.alert("Could not save template: " + err.message); });
  }

  function shrinkBg(img){
    var dims = [1400, 1100, 800, 600];
    var qs = [0.8, 0.65, 0.5];
    for(var i = 0; i < dims.length; i++){
      var s = Math.min(1, dims[i] / Math.max(img.width, img.height));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * s));
      cv.height = Math.max(1, Math.round(img.height * s));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      for(var j = 0; j < qs.length; j++){
        var url = cv.toDataURL("image/jpeg", qs[j]);
        if(url.length <= BG_LIMIT) return url;
      }
    }
    return "";
  }

  var coverClick = function(e){
    var btn = (e.target && e.target.closest) ? e.target.closest("[data-ic]") : null;
    if(!btn) return;
    var block = btn.closest('.c-block[data-type="cover"]');
    if(!block) return;
    e.preventDefault();
    var act = btn.getAttribute("data-ic");
    var f;
    if(act === "new"){ setInner(block, editorHtml(autofill(), "", {}, null)); }
    else if(act === "saved"){ toggleSaved(block); }
    else if(act === "pick"){ pickSaved(block, btn.getAttribute("data-id")); }
    else if(act === "del-tpl"){ deleteSaved(btn); }
    else if(act === "save-tpl"){ saveTemplate(block); }
    else if(act === "change"){
      if(window.confirm("Replace this cover? Your edits to it will be lost.")) setInner(block, chooserHtml());
    }
    else if(act === "logo"){ var li = block.querySelector(".ic-logo-input"); if(li) li.click(); }
    else if(act === "logo-rm"){ rebuild(block, { logo:"" }); }
    else if(act === "bg"){ var bi = block.querySelector(".ic-bg-input"); if(bi) bi.click(); }
    else if(act === "bg-rm"){ rebuild(block, { bg:{ src:"", shade:0 } }); }
    else if(act === "swatch"){
      f = activeField(block);
      var col = btn.getAttribute("data-color");
      if(f && /^#[0-9a-fA-F]{6}$/.test(col || "")){ setAttr(f, "color", col); syncBar(block); }
    }
    else if(act === "bold" || act === "italic"){
      f = activeField(block);
      if(f){
        var cs = window.getComputedStyle(f);
        var isOn = act === "bold" ? parseInt(cs.fontWeight, 10) >= 600 : cs.fontStyle === "italic";
        setAttr(f, act, isOn ? "0" : "1");
        syncBar(block);
      }
    }
    else if(act === "reset-style"){
      f = activeField(block);
      if(f){
        ["font","size","color","bold","italic"].forEach(function(n){ f.removeAttribute("data-" + n); });
        applyField(f);
        syncBar(block);
      }
    }
  };
  document.addEventListener("click", coverClick, true);

  function onStyleInput(e){
    var el = e.target;
    if(!el || !el.getAttribute) return;
    var k = el.getAttribute("data-ics");
    if(!k) return;
    var block = el.closest('.c-block[data-type="cover"]');
    if(!block) return;
    if(k === "shade"){
      var sh = block.querySelector(".ic-shade");
      var v = Math.max(0, Math.min(80, parseInt(el.value, 10) || 0));
      if(sh){ sh.setAttribute("data-shade", String(v)); sh.style.background = "rgba(0,0,0," + (v / 100) + ")"; }
      return;
    }
    var f = activeField(block);
    if(!f) return;
    if(k === "font"){ setAttr(f, "font", fontStack(el.value) ? el.value : ""); }
    else if(k === "size"){
      var n = parseInt(el.value, 10);
      if(el.value === "") setAttr(f, "size", "");
      else if(n >= 8 && n <= 120) setAttr(f, "size", n);
    }
    else if(k === "color"){ if(/^#[0-9a-fA-F]{6}$/.test(el.value)) setAttr(f, "color", el.value); }
  }
  document.addEventListener("input", onStyleInput);
  document.addEventListener("change", onStyleInput);

  document.addEventListener("focusin", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var fld = t.closest("[data-field]");
    if(!fld) return;
    var block = fld.closest('.c-block[data-type="cover"]');
    if(!block || !block.querySelector(".ic-bar")) return;
    var olds = block.querySelectorAll(".ic-active");
    for(var i = 0; i < olds.length; i++) olds[i].classList.remove("ic-active");
    fld.classList.add("ic-active");
    block._icActive = fld;
    syncBar(block);
  });

  function restoreDrag(){
    var bs = document.querySelectorAll('.c-block[data-type="cover"]');
    var ae = document.activeElement;
    for(var i = 0; i < bs.length; i++){
      if(bs[i]._icDrag){
        if(ae && ae.closest && ae.closest(".ic-bar") && /^(INPUT|SELECT)$/.test(ae.tagName)) continue;
        bs[i].setAttribute("draggable", "true");
        bs[i]._icDrag = false;
      }
    }
  }
  document.addEventListener("pointerdown", function(e){
    var bar = (e.target && e.target.closest) ? e.target.closest(".ic-bar") : null;
    if(!bar) return;
    var block = bar.closest(".c-block");
    if(block && block.getAttribute("draggable") === "true"){ block.setAttribute("draggable", "false"); block._icDrag = true; }
  }, true);
  document.addEventListener("pointerup", function(){ setTimeout(restoreDrag, 0); }, true);
  document.addEventListener("focusout", function(){ setTimeout(restoreDrag, 0); }, true);

  document.addEventListener("change", function(e){
    var inp = e.target;
    if(!inp || !inp.classList) return;
    var isLogo = inp.classList.contains("ic-logo-input");
    var isBg = inp.classList.contains("ic-bg-input");
    if(!isLogo && !isBg) return;
    var block = inp.closest('.c-block[data-type="cover"]');
    var file = inp.files && inp.files[0];
    if(!block || !file) return;
    var rd = new FileReader();
    rd.onload = function(){
      var img = new Image();
      img.onload = function(){
        if(isLogo){
          var s = Math.min(1, 320 / Math.max(img.width, img.height));
          var cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.width * s));
          cv.height = Math.max(1, Math.round(img.height * s));
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          var url = cv.toDataURL("image/png");
          if(url.length > 400000) url = cv.toDataURL("image/jpeg", 0.85);
          rebuild(block, { logo:url });
        } else {
          var bgUrl = shrinkBg(img);
          if(!bgUrl){ window.alert("That image is too detailed to store. Try a smaller or simpler image."); return; }
          var c = extract(block);
          rebuild(block, { bg:{ src:bgUrl, shade: (c.bg && c.bg.src) ? c.bg.shade : 30 } });
        }
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });

  window.ImpactCover = { template:template, extract:extract, renderView:viewHtml };
})();