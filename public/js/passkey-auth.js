import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = await fetch("/__/firebase/init.json")
  .then(r => r.json())
  .catch(() => null);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

function cleanKey(value){
  return String(value || "").trim().replace(/\s+/g,"").toUpperCase();
}

export async function validatePasskey(passkeyValue, gate){
  const typed = cleanKey(passkeyValue);

  if(!typed){
    return { ok:false, message:"Enter your passkey." };
  }

  const snap = await getDocs(collection(db, "impactPasskeys"));

  let foundDoc = null;
  let foundData = null;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const stored = cleanKey(data.passkey || data.key || data.code);

    if(stored === typed){
      foundDoc = docSnap;
      foundData = data;
    }
  });

  if(!foundData){
    return { ok:false, message:"Invalid passkey." };
  }

  if(String(foundData.status || "active").toLowerCase() !== "active"){
    return { ok:false, message:"This passkey has been deactivated." };
  }

  await addDoc(collection(db, "impactGateVisits"), {
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
