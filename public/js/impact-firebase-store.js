(function(){
  function load(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector('script[src="'+src+'"]')) return resolve();
      const s=document.createElement("script");
      s.src=src;
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  async function ready(){
    await load("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
    await load("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore-compat.js");
    await load("https://www.gstatic.com/firebasejs/10.12.4/firebase-storage-compat.js");
    await load("/__/firebase/init.js");

    return {
      db: firebase.firestore(),
      storage: firebase.storage()
    };
  }

  function cleanKey(v){
    return String(v || "").trim().replace(/\s+/g,"").toUpperCase();
  }

  function makeId(prefix){
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2,8);
  }

  async function saveDoc(collectionName, data, id){
    const { db } = await ready();
    const docId = id || data.id || makeId(collectionName);

    await db.collection(collectionName).doc(docId).set({
      ...data,
      id: docId,
      updatedAt: new Date().toISOString()
    }, { merge:true });

    return docId;
  }

  async function getDocs(collectionName){
    const { db } = await ready();
    const snap = await db.collection(collectionName).get();
    const rows = [];
    snap.forEach(doc => rows.push({ id:doc.id, ...doc.data() }));
    return rows;
  }

  async function getDoc(collectionName, id){
    const { db } = await ready();
    const ref = await db.collection(collectionName).doc(id).get();
    if(!ref.exists) return null;
    return { id:ref.id, ...ref.data() };
  }

  async function deleteDoc(collectionName, id){
    const { db } = await ready();
    await db.collection(collectionName).doc(id).delete();
  }

  async function uploadFile(file, folder, subfolder){
    const { storage } = await ready();

    const safeName = file.name.replace(/[^\w.\-]+/g,"_");
    const safeFolder = String(folder || "uploads").replace(/[^\w\-\/]+/g,"_");
    const safeSub = subfolder ? String(subfolder).replace(/[^\w\-\/]+/g,"_") + "/" : "";
    const path = "impact/" + safeFolder + "/" + safeSub + Date.now() + "-" + safeName;

    const ref = storage.ref(path);
    await ref.put(file);

    return {
      url: await ref.getDownloadURL(),
      path,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      folder: safeFolder,
      createdAt: new Date().toISOString()
    };
  }

  async function saveLessonPlan(plan){
    return await saveDoc("lessonPlans", {
      title: plan.title || plan.name || "Untitled Lesson Plan",
      name: plan.title || plan.name || "Untitled Lesson Plan",
      level: plan.level || "Absolute Beginner",
      content: plan.content || "",
      media: plan.media || [],
      createdAt: plan.createdAt || new Date().toISOString()
    }, plan.id);
  }

  async function getLessonPlans(){
    return await getDocs("lessonPlans");
  }

  async function getLessonPlan(id){
    return await getDoc("lessonPlans", id);
  }

  async function deleteLessonPlan(id){
    return await deleteDoc("lessonPlans", id);
  }

  async function validatePasskey(passkeyValue, gate){
    const { db } = await ready();
    const typed = cleanKey(passkeyValue);

    const snap = await db.collection("impactPasskeys").get();

    let foundDoc = null;
    let foundData = null;

    snap.forEach(doc=>{
      const data = doc.data();
      const stored = cleanKey(data.passkey || data.key || data.code);

      if(stored === typed){
        foundDoc = doc;
        foundData = data;
      }
    });

    if(!foundData){
      return { ok:false, message:"Invalid passkey." };
    }

    if(String(foundData.status || "active").toLowerCase() !== "active"){
      return { ok:false, message:"This passkey has been deactivated." };
    }

    await db.collection("impactGateVisits").add({
      passkeyId: foundDoc.id,
      name: foundData.name || "Unknown",
      role: foundData.role || "Teacher",
      gate: gate || "personnel",
      passkey: foundData.passkey || passkeyValue,
      time: new Date().toISOString()
    });

    return {
      ok:true,
      ownerName: foundData.name || "Personnel",
      role: foundData.role || "Teacher"
    };
  }

  async function createPasskey(item){
    const { db } = await ready();

    const existing = await db.collection("impactPasskeys")
      .where("passkey","==",item.passkey)
      .limit(1)
      .get();

    const data = {
      name:item.name || "Unnamed",
      role:item.role || "Teacher",
      passkey:item.passkey,
      status:item.status || "active",
      createdAt:item.createdAt || new Date().toISOString(),
      source:item.source || "configuration_page"
    };

    if(existing.empty){
      const ref = await db.collection("impactPasskeys").add(data);
      return ref.id;
    }

    await existing.docs[0].ref.set(data,{merge:true});
    return existing.docs[0].id;
  }

  window.ImpactFirebaseStore = {
    ready,
    saveDoc,
    getDocs,
    getDoc,
    deleteDoc,
    uploadFile,

    saveLessonPlan,
    getLessonPlans,
    getLessonPlan,
    deleteLessonPlan,

    validatePasskey,
    createPasskey,

    collections:{
      passkeys:"impactPasskeys",
      visits:"impactGateVisits",
      lessonPlans:"lessonPlans",
      learners:"learners",
      classes:"classes",
      recordings:"recordings",
      activities:"activities",
      progress:"progress",
      delfMocks:"delfMocks",
      configuration:"configuration"
    }
  };
})();
