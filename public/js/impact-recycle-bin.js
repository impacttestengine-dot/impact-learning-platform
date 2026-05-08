(function(){
  window.ImpactRecycleBin = {
    async send(item){
      try{
        if(!window.firebase || !firebase.firestore) return;
        const db = firebase.firestore();
        await db.collection("recycleBin").add({
          ...item,
          deletedAt: new Date().toISOString(),
          deletedAtText: new Date().toLocaleString(),
          sourceUrl: location.pathname,
          restored: false
        });
      }catch(e){
        console.warn("Recycle bin log failed", e);
      }
    }
  };

  function patchFirestore(){
    if(!window.firebase || !firebase.firestore || firebase.__impactRecyclePatched) return;
    firebase.__impactRecyclePatched = true;

    const proto = firebase.firestore.DocumentReference.prototype;
    const originalDelete = proto.delete;

    proto.delete = async function(){
      let data = {};
      try{
        const snap = await this.get();
        if(snap.exists) data = snap.data() || {};
      }catch(e){}

      await window.ImpactRecycleBin.send({
        type: "firestore-document",
        title: data.title || data.name || data.filename || data.fileName || this.id,
        collection: this.parent && this.parent.id ? this.parent.id : "",
        documentId: this.id,
        data: data
      });

      return originalDelete.apply(this, arguments);
    };
  }

  function patchStorage(){
    if(!window.firebase || !firebase.storage || firebase.__impactStorageRecyclePatched) return;
    firebase.__impactStorageRecyclePatched = true;

    const proto = firebase.storage.Reference.prototype;
    const originalDelete = proto.delete;

    proto.delete = async function(){
      await window.ImpactRecycleBin.send({
        type: "storage-file",
        title: this.name || this.fullPath || "Deleted file",
        storagePath: this.fullPath || "",
        fileName: this.name || ""
      });

      return originalDelete.apply(this, arguments);
    };
  }

  function init(){
    patchFirestore();
    patchStorage();
    setTimeout(patchFirestore, 1000);
    setTimeout(patchStorage, 1000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
