/* impact-cover-tools.js
   While a Cover block is the only selected block, collapse the builder's own
   toolbars (Undo/Select All/Clear row + shared text toolbar) and show a small
   toggle pill to bring them back. Pure ASCII only. */
(function(){
  var COLLAPSE = "ic-tools-collapsed";
  var forceOpen = false, lastSel = null, timer = null, btn = null;

  function injectStyles(){
    if(document.getElementById("ic-tools-styles")) return;
    var s = document.createElement("style");
    s.id = "ic-tools-styles";
    s.textContent = [
      ".canvas-panel.ic-tools-collapsed .canvas-toolbar,.canvas-panel.ic-tools-collapsed .fmt-bar{display:none !important}",
      ".ic-toolsbtn{display:none;margin:8px 14px 0;padding:6px 12px;border-radius:999px;border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;font:700 .74rem Inter,sans-serif;cursor:pointer}",
      ".ic-toolsbtn.on{display:inline-flex;align-items:center;gap:6px}",
      ".ic-toolsbtn:hover{background:#ede9fe}"
    ].join("");
    document.head.appendChild(s);
  }

  function ensureBtn(panel){
    if(btn && btn.parentNode === panel) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ic-toolsbtn";
    btn.addEventListener("click", function(e){
      e.preventDefault();
      forceOpen = !forceOpen;
      apply();
    });
    panel.insertBefore(btn, panel.firstChild);
  }

  function coverSelected(){
    var sel = document.querySelectorAll(".c-block.selected");
    if(sel.length !== 1) return null;
    return sel[0].querySelector('[class^="ic-"],[class*=" ic-"]') ? sel[0] : null;
  }

  function apply(){
    var panel = document.querySelector(".canvas-panel");
    if(!panel) return;
    ensureBtn(panel);
    var cover = coverSelected();
    if(cover !== lastSel){ forceOpen = false; lastSel = cover; }
    var collapse = !!cover && !forceOpen;
    if(panel.classList.contains(COLLAPSE) !== collapse) panel.classList.toggle(COLLAPSE, collapse);
    var show = !!cover;
    if(btn.classList.contains("on") !== show) btn.classList.toggle("on", show);
    var label = collapse ? "\u25BE Show builder tools" : "\u25B4 Hide builder tools";
    if(btn.textContent !== label) btn.textContent = label;
  }

  function schedule(){
    if(timer) return;
    timer = setTimeout(function(){ timer = null; apply(); }, 0);
  }

  function init(){
    injectStyles();
    apply();
    new MutationObserver(schedule).observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ["class"]
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();