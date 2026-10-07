/* impact-cover.js - shared Cover Page block for the Impact builders and viewers */
(function(){
  if(window.ImpactCover) return;

  var COLLECTION = "coverTemplates";
  var PH = {
    org:"Organisation name",
    label:"Document type",
    title:"Document title",
    subtitle:"Subtitle (optional)",
    level:"Level",
    teacher:"Teacher",
    date:"Date"
  };
  var META = ["level","teacher","date"];
  var META_LABEL = { level:"Level", teacher:"Teacher", date:"Date" };
  var SAVED = {};

  var CSS = [
    '.ic-cover{background:#fff;color:#1f2430;border:1px solid #e5e7eb;border-top:6px solid #B5654A;border-radius:14px;padding:44px 36px;text-align:center;font-family:Inter,Arial,sans-serif;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-sizing:border-box;width:100%}',
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
    '.ic-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
    '.ic-btn{padding:7px 14px;border-radius:9px;border:1.5px solid #d1d5db;background:#fff;color:#374151;font-size:.78rem;font-weight:700;cursor:pointer;font-family:Inter,Arial,sans-serif}',
    '.ic-btn:hover{border-color:#B5654A;color:#B5654A}',
    '.ic-btn-primary{background:#B5654A;border-color:#B5654A;color:#fff}',
    '.ic-btn-primary:hover{color:#fff;opacity:.9}',
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
    (document.head || document.documentElement).appendChild(s);
  }
  injectCss();

  function esc(s){
    return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function safeLogo(src){
    return (typeof src === "string" && /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(src)) ? src : "";
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
      org:"IMPACT",
      label:docLabel(),
      title:t ? esc(String(t.value || "").trim()) : "",
      subtitle:"",
      level:l ? esc(l.value) : "",
      teacher:esc(whoAmI()),
      date:today()
    };
  }

  function fieldEl(k, val, cls){
    return '<div class="' + cls + '" data-field="' + k + '" data-ph="' + PH[k] + '" contenteditable="true">' + (val || "") + '</div>';
  }
  function editorHtml(f, logo){
    f = f || {};
    var lg = safeLogo(logo);
    var h = '<div class="ic-controls">'
      + '<button type="button" class="ic-btn" data-ic="logo">' + (lg ? "Change logo" : "Add logo") + '</button>'
      + (lg ? '<button type="button" class="ic-btn" data-ic="logo-rm">Remove logo</button>' : '')
      + '<button type="button" class="ic-btn" data-ic="save-tpl">Save as template</button>'
      + '<button type="button" class="ic-btn" data-ic="change">Change cover</button>'
      + '<input type="file" class="ic-logo-input" accept="image/*" style="display:none">'
      + '</div>';
    h += '<div class="ic-cover">';
    if(lg) h += '<img class="ic-logo" src="' + lg + '" alt="">';
    h += fieldEl("org", f.org, "ic-org");
    h += '<div class="ic-rule"></div>';
    h += fieldEl("label", f.label, "ic-label");
    h += fieldEl("title", f.title, "ic-title");
    h += fieldEl("subtitle", f.subtitle, "ic-subtitle");
    h += '<div class="ic-meta">';
    META.forEach(function(k){
      h += '<div class="ic-meta-item"><div class="ic-meta-k">' + META_LABEL[k] + '</div>' + fieldEl(k, f[k], "ic-meta-v") + '</div>';
    });
    h += '</div></div>';
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
    var lg = safeLogo(b.logo);
    function one(k, cls){ return f[k] ? '<div class="' + cls + '">' + f[k] + '</div>' : ""; }
    var meta = "";
    META.forEach(function(k){
      if(f[k]) meta += '<div class="ic-meta-item"><div class="ic-meta-k">' + META_LABEL[k] + '</div><div class="ic-meta-v">' + f[k] + '</div></div>';
    });
    return '<div class="ic-cover">'
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
      if(data && data.mode === "editor") return editorHtml(data.fields, data.logo);
      return chooserHtml();
    }};
  }
  function extract(block){
    var cover = block.querySelector(".ic-cover");
    if(!cover) return { mode:"choose" };
    var f = {};
    Object.keys(PH).forEach(function(k){
      var el = cover.querySelector('[data-field="' + k + '"]');
      f[k] = el ? el.innerHTML : "";
    });
    var img = cover.querySelector(".ic-logo");
    return { mode:"editor", fields:f, logo: img ? safeLogo(img.getAttribute("src")) : "" };
  }
  function setInner(block, html){
    var inner = block.querySelector(".c-block-inner");
    if(inner) inner.innerHTML = html;
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
        return '<div class="ic-saved-item" data-ic="pick" data-id="' + esc(x.id) + '"><span class="ic-saved-name">' + esc(x.name || "Untitled cover") + '</span><button type="button" class="ic-saved-del" data-ic="del-tpl" data-id="' + esc(x.id) + '" title="Delete">x</button></div>';
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
    setInner(block, editorHtml(base, t.logo));
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
      name:name.trim(),
      fields:c.fields,
      logo:c.logo || "",
      createdBy:whoAmI(),
      createdAt:new Date().toISOString()
    }).then(function(){
      window.alert("Cover template saved.");
    }).catch(function(err){ window.alert("Could not save template: " + err.message); });
  }

  document.addEventListener("click", function(e){
    var btn = (e.target && e.target.closest) ? e.target.closest("[data-ic]") : null;
    if(!btn) return;
    var block = btn.closest('.c-block[data-type="cover"]');
    if(!block) return;
    e.preventDefault();
    e.stopPropagation();
    var act = btn.getAttribute("data-ic");
    if(act === "new"){ setInner(block, editorHtml(autofill(), "")); }
    else if(act === "saved"){ toggleSaved(block); }
    else if(act === "pick"){ pickSaved(block, btn.getAttribute("data-id")); }
    else if(act === "del-tpl"){ deleteSaved(btn); }
    else if(act === "save-tpl"){ saveTemplate(block); }
    else if(act === "change"){
      if(window.confirm("Replace this cover? Your edits to it will be lost.")) setInner(block, chooserHtml());
    }
    else if(act === "logo"){
      var inp = block.querySelector(".ic-logo-input");
      if(inp) inp.click();
    }
    else if(act === "logo-rm"){
      var c = extract(block);
      setInner(block, editorHtml(c.fields, ""));
    }
  });

  document.addEventListener("change", function(e){
    var inp = e.target;
    if(!inp || !inp.classList || !inp.classList.contains("ic-logo-input")) return;
    var block = inp.closest('.c-block[data-type="cover"]');
    var file = inp.files && inp.files[0];
    if(!block || !file) return;
    var rd = new FileReader();
    rd.onload = function(){
      var img = new Image();
      img.onload = function(){
        var s = Math.min(1, 320 / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * s));
        cv.height = Math.max(1, Math.round(img.height * s));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        var url = cv.toDataURL("image/png");
        if(url.length > 400000) url = cv.toDataURL("image/jpeg", 0.85);
        var c = extract(block);
        setInner(block, editorHtml(c.fields, url));
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });

  window.ImpactCover = { template:template, extract:extract, renderView:viewHtml };
})();