const admin = require("firebase-admin");

const projectId = process.env.NEW_PROJECT_ID;

const app = admin.initializeApp({
  projectId,
  credential: admin.credential.applicationDefault()
});

const db = app.firestore();

const passkeys = [
  { name:"Emelia", role:"Impact Team lead", passkey:"IMP-ZXJ$453-AM", status:"active" },
  { name:"Adelaide", role:"Academic Team lead", passkey:"IMP-HYX$862-EH", status:"active" },
  { name:"Theodosia", role:"Teacher", passkey:"IMP-VGJ$447-RS", status:"active" },
  { name:"Prosper", role:"Teacher", passkey:"IMP-YPW$392-HZ", status:"active" }
];

async function seed(){
  for(const item of passkeys){
    const existing = await db.collection("impactPasskeys")
      .where("passkey","==",item.passkey)
      .limit(1)
      .get();

    if(existing.empty){
      await db.collection("impactPasskeys").add({
        ...item,
        createdAt:new Date().toISOString(),
        source:"required_seed"
      });
      console.log("Added:", item.name);
    }else{
      await existing.docs[0].ref.set({
        ...item,
        updatedAt:new Date().toISOString()
      }, { merge:true });
      console.log("Updated:", item.name);
    }
  }

  console.log("Passkey seed complete.");
}

seed()
  .then(()=>process.exit(0))
  .catch(err=>{
    console.error(err);
    process.exit(1);
  });
