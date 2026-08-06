/* impact-publish.js
   Passkey verification gate + audit logging for published items.
   Requires firebase compat SDK already loaded on the page.
   Pure ASCII only. */
(function(){

  function injectStyles(){
    if(document.getElementById("impact-publish-styles")) return;
    const s = document.createElement("style");
    s.id = "impact-publish-styles";
    s.textContent = [
      '.ipk-overlay{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:20px}',
      '.ipk-overlay.show{display:flex}',
      '.ipk-card{width:min(400px,100%);background:#12151f;border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.6)}',
      '.ipk-title{font-family:"Sorts Mill Goudy",Georgia,serif;font-weight:400;font-size:1.35rem;color:#fff;margin-bottom:6px}',
      '.ipk-sub{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:18px}',
      '.ipk-input{width:100%;padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;font-family:Inter,sans-serif;font-weight:700;font-size:.95rem;outline:none;letter-spacing:.12em;text-align:center}',
      '.ipk-input:focus{border-color:rgba(99,179,237,.5)}',
      '.ipk-msg{min-height:18px;font-size:.78rem;font-weight:700;color:#fca5a5;margin-top:8px;text-align:center}',
      '.ipk-actions{display:flex;gap:10px;margin-top:16px}',
      '.ipk-btn{flex:1;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;font-family:Inter,sans-serif;font-weight:900;font-size:.84rem;cursor:pointer}',
      '.ipk-btn:hover{background:rgba(255,255,255,.16)}',
      '.ipk-btn.primary{background:rgba(99,179,237,.22);border-color:rgba(99,179,237,.45);color:#90cdf4}',
      '.ipk-btn.danger{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}'
    ].join("");
    document.head.appendChild(s);
  }

  function buildModal(){
    let el = document.getElementById("ipkOverlay");
    if(el) return el;
    el = document.createElement("div");
    el.className = "ipk-overlay";
    el.id = "ipkOverlay";
    el.innerHTML = [
      '<div class="ipk-card">',
        '<div class="ipk-title" id="ipkTitle">Confirm with passkey</div>',
        '<div class="ipk-sub" id="ipkSub">This item is published. Enter your passkey to continue. This action will be logged.</div>',
        '<input class="ipk-input" id="ipkInput" type="password" placeholder="Your passkey" autocomplete="off">',
        '<div class="ipk-msg" id="ipkMsg"></div>',
        '<div class="ipk-actions">',
          '<button class="ipk-btn" id="ipkCancel" type="button">Cancel</button>',
          '<button class="ipk-btn primary" id="ipkConfirm" type="button">Confirm</button>',
        '</div>',
      '</div>'
    ].join("");
    document.body.appendChild(el);
    return el;
  }

  function cleanKey(v){ return String(v==null?"":v).replace(/\s+/g,"").toLowerCase(); }

  /* Opens the passkey modal. Resolves with { name, role } on success,
     or null if the user cancelled or failed. */
  function requirePasskey(actionLabel, dangerous){
    injectStyles();
    const overlay = buildModal();
    const input   = document.getElementById("ipkInput");
    const msg     = document.getElementById("ipkMsg");
    const confirm = document.getElementById("ipkConfirm");
    const cancel  = document.getElementById("ipkCancel");
    const title   = document.getElementById("ipkTitle");

    title.textContent = actionLabel || "Confirm with passkey";
    confirm.className = "ipk-btn " + (dangerous ? "danger" : "primary");
    input.value = "";
    msg.textContent = "";
    overlay.classList.add("show");
    setTimeout(function(){ input.focus(); }, 50);

    return new Promise(function(resolve){
      function close(result){
        overlay.classList.remove("show");
        confirm.onclick = null;
        cancel.onclick = null;
        input.onkeydown = null;
        resolve(result);
      }

      cancel.onclick = function(){ close(null); };

      confirm.onclick = async function(){
        const typed = cleanKey(input.value);
        if(!typed){ msg.textContent = "Please enter your passkey."; return; }
        confirm.disabled = true;
        confirm.textContent = "Checking...";
        try{
          const db = firebase.firestore();
          const snap = await db.collection("impactPasskeys").get();
          let found = null;
          snap.forEach(function(d){
            const data = d.data();
            const stored = cleanKey(data.passkey || data.key || data.code);
            if(stored === typed) found = data;
          });

          if(!found){
            msg.textContent = "Invalid passkey.";
            return;
          }
          if(String(found.status || "active").toLowerCase() !== "active"){
            msg.textContent = "This passkey has been deactivated.";
            return;
          }
          if(String(found.role || "").toLowerCase() === "learner"){
            msg.textContent = "Learner passkeys cannot perform this action.";
            return;
          }
          close({ name: found.name || "Unknown", role: found.role || "Teacher" });
        }catch(err){
          msg.textContent = "Could not verify: " + err.message;
        }finally{
          confirm.disabled = false;
          confirm.textContent = "Confirm";
        }
      };

      input.onkeydown = function(e){ if(e.key === "Enter") confirm.click(); };
    });
  }

  /* Writes an audit record. Never throws - logging must not block the action. */
  async function logAction(entry){
    try{
      const db = firebase.firestore();
      await db.collection("auditLog").add({
        action:       entry.action || "unknown",
        itemType:     entry.itemType || "",
        itemId:       entry.itemId || "",
        itemTitle:    entry.itemTitle || "",
        performedBy:  entry.performedBy || "",
        performedRole:entry.performedRole || "",
        sessionUser:  sessionStorage.getItem("impactAccessName") || sessionStorage.getItem("impactPersonnelName") || "",
        details:      entry.details || "",
        at:           new Date().toISOString()
      });
    }catch(e){
      console.warn("Audit log failed:", e.message);
    }
  }

  window.ImpactPublish = {
    requirePasskey: requirePasskey,
    logAction: logAction
  };
})();