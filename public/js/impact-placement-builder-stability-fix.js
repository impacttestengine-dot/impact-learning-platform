(function(){
  const SAVE_DELAY = 2500;
  let saveTimer = null;
  let selectedCard = null;

  function qs(id){ return document.getElementById(id); }

  function getCanvas(){
    return qs("canvas") || document.querySelector(".canvas,.lesson-canvas,#builderCanvas");
  }

  function getTitle(){
    return qs("testTitle") || qs("lessonTitle") || document.querySelector("input[placeholder*='title' i]");
  }

  function getSaveButton(){
    return qs("saveBtn") || Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="save");
  }

  function getViewButton(){
    return qs("viewBtn") || Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="view");
  }

  function selectCard(card){
    selectedCard = card;
    document.querySelectorAll(".lesson-card,.test-card,.builder-card").forEach(c=>c.classList.remove("active"));
    card.classList.add("active");
  }

  function bindCards(){
    document.querySelectorAll(".lesson-card,.test-card,.builder-card").forEach(card=>{
      if(card.dataset.boundPlacementFix) return;
      card.dataset.boundPlacementFix="1";

      card.addEventListener("click",()=>selectCard(card));
      card.addEventListener("input",scheduleAutosave);
    });

    makeMediaResizable();
  }

  function serialize(){
    const canvas=getCanvas();
    return {
      id: sessionStorage.getItem("impactEditingPlacementId") || new URLSearchParams(location.search).get("edit") || ("PT-" + Date.now()),
      title: getTitle()?.value || "Untitled Placement Test",
      content: canvas?.innerHTML || "",
      updatedAt:new Date().toISOString()
    };
  }

  function saveLocal(){
    const data=serialize();
    sessionStorage.setItem("impactEditingPlacementId",data.id);

    const all=JSON.parse(localStorage.getItem("impactPlacementTests")||"[]");
    const idx=all.findIndex(x=>x.id===data.id);
    if(idx>=0) all[idx]=data; else all.push(data);
    localStorage.setItem("impactPlacementTests",JSON.stringify(all));

    const tick=qs("saveTick") || document.querySelector(".save-tick");
    if(tick){
      tick.classList.add("show");
      setTimeout(()=>tick.classList.remove("show"),1200);
    }

    return data;
  }

  function scheduleAutosave(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveLocal,SAVE_DELAY);
  }

  function cleanForView(html){
    const wrap=document.createElement("div");
    wrap.innerHTML=html;

    wrap.querySelectorAll(".delete-btn,.card-delete,.remove-card,.x-btn,.early-end-inline-box").forEach(el=>el.remove());

    wrap.querySelectorAll(".lesson-card,.test-card,.builder-card").forEach(card=>{
      card.removeAttribute("contenteditable");
      card.classList.remove("active");
      card.style.border="0";
      card.style.background="transparent";
      card.style.boxShadow="none";
      card.style.padding="0";
      card.style.margin="0 0 18px";
      card.style.borderRadius="0";
    });

    wrap.querySelectorAll(".lesson-media-resizer,.media-resizer").forEach(box=>{
      box.style.border="0";
      box.style.padding="0";
      box.style.resize="none";
      box.style.overflow="visible";
    });

    return wrap.innerHTML;
  }

  function openCleanView(){
    const data=saveLocal();
    const clean=cleanForView(data.content);

    const w=window.open("","_blank");
    if(!w){
      alert("Please allow popups so the view page can open.");
      return;
    }

    w.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${data.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Sorts+Mill+Goudy&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
body{margin:0;background:linear-gradient(180deg,#111827,#05060b);color:#fff;font-family:Inter,system-ui,sans-serif}
main{max-width:900px;margin:0 auto;padding:70px 42px;line-height:1.75}
h1,h2,h3{font-family:"Sorts Mill Goudy",Georgia,serif;font-weight:400;margin:18px 0 10px}
h1{font-size:3.1rem;text-align:center}
p,li{font-size:1rem}
img,video{max-width:100%;height:auto;border-radius:16px;margin:14px 0}
audio{width:100%;margin:14px 0}
</style>
</head>
<body>
<main>
<h1>${data.title}</h1>
${clean}
</main>
</body>
</html>
    `);

    w.document.close();
  }

  function wrapMedia(el){
    if(el.closest(".media-resizer,.lesson-media-resizer")) return;

    const box=document.createElement("div");
    box.className="media-resizer";
    box.style.cssText="display:inline-block;resize:both;overflow:auto;width:70%;min-width:120px;max-width:100%;padding:8px;border:1px dashed rgba(232,216,166,.38);border-radius:18px;";
    el.parentNode.insertBefore(box,el);
    box.appendChild(el);
  }

  function makeMediaResizable(){
    document.querySelectorAll("img,video").forEach(el=>{
      const canvas=getCanvas();
      if(canvas && canvas.contains(el)){
        wrapMedia(el);
        el.style.width="100%";
        el.style.height="auto";
        el.style.display="block";
      }
    });
  }

  function applyCardStyle(prop,value){
    if(!selectedCard){
      const canvas=getCanvas();
      if(canvas){
        canvas.querySelectorAll(".lesson-card,.test-card,.builder-card").forEach(card=>card.style[prop]=value);
      }
      return;
    }
    selectedCard.style[prop]=value;
  }

  function init(){
    const canvas=getCanvas();
    if(!canvas) return;

    bindCards();

    canvas.addEventListener("click",e=>{
      const card=e.target.closest(".lesson-card,.test-card,.builder-card");
      if(card) selectCard(card);
    });

    canvas.addEventListener("input",scheduleAutosave);

    const observer=new MutationObserver(()=>{
      bindCards();
      scheduleAutosave();
    });
    observer.observe(canvas,{childList:true,subtree:true});

    const saveBtn=getSaveButton();
    if(saveBtn){
      saveBtn.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        saveLocal();
      };
    }

    const viewBtn=getViewButton();
    if(viewBtn){
      viewBtn.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        openCleanView();
      };
    }

    const alignment=qs("alignment") || document.querySelector("select[id*='align' i]");
    if(alignment){
      alignment.addEventListener("change",()=>applyCardStyle("textAlign",alignment.value));
    }

    document.querySelectorAll("button").forEach(btn=>{
      const txt=(btn.textContent||"").trim().toLowerCase();
      if(txt.includes("align left")) btn.onclick=()=>applyCardStyle("textAlign","left");
      if(txt.includes("align center")) btn.onclick=()=>applyCardStyle("textAlign","center");
      if(txt.includes("align right")) btn.onclick=()=>applyCardStyle("textAlign","right");
    });

    document.querySelectorAll("button,a,[role='button']").forEach(btn=>{
      btn.style.transition="transform .15s ease, background .18s ease, box-shadow .18s ease, opacity .15s ease";
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
