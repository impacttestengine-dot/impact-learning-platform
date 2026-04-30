(function(){
  async function getDb(){
    if(window.firebase && firebase.firestore) return firebase.firestore();
    return null;
  }

  window.ImpactRecycleBin = {
    async moveToBin(item){
      const db = await getDb();
      const payload = {
        ...item,
        deletedAt: new Date().toISOString(),
        deletedBy: sessionStorage.getItem("impactPersonnelName") || sessionStorage.getItem("impactAccessName") || "Unknown",
        side: "personnel"
      };

      if(db){
        await db.collection("personnelRecycleBin").add(payload);
      }else{
        const local = JSON.parse(localStorage.getItem("personnelRecycleBin") || "[]");
        local.push(payload);
        localStorage.setItem("personnelRecycleBin", JSON.stringify(local));
      }
    }
  };
})();
