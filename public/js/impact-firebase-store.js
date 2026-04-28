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

  async function deleteDoc(collectionName, id){
    const { db } = await ready();
    await db.collection(collectionName).doc(id).delete();
  }

  async function uploadFile(file, folder){
    const { storage } = await ready();
    const safeName = file.name.replace(/[^\w.\-]+/g,"_");
    const path = "impact/" + folder + "/" + Date.now() + "-" + safeName;
    const ref = storage.ref(path);

    await ref.put(file);

    return {
      url: await ref.getDownloadURL(),
      path,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      folder
    };
  }

  async function saveLessonPlan(plan){
    return await saveDoc("lessonPlans", {
      title: plan.title || "Untitled Lesson Plan",
      level: plan.level || "Absolute Beginner",
      content: plan.content || "",
      media: plan.media || [],
      createdAt: plan.createdAt || new Date().toISOString()
    }, plan.id);
  }

  async function getLessonPlans(){
    return await getDocs("lessonPlans");
  }

  async function deleteLessonPlan(id){
    return await deleteDoc("lessonPlans", id);
  }

  async function saveDashboardModule(moduleName, data, id){
    return await saveDoc(moduleName, data, id);
  }

  window.ImpactFirebaseStore = {
    ready,
    saveDoc,
    getDocs,
    deleteDoc,
    uploadFile,

    saveLessonPlan,
    getLessonPlans,
    deleteLessonPlan,

    saveDashboardModule,

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
