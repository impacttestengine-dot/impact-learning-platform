import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

function clean(value){
  return String(value || "").trim().toUpperCase();
}

function flattenValues(obj){
  const values = [];

  function walk(item){
    if(item === null || item === undefined) return;

    if(typeof item === "string" || typeof item === "number"){
      values.push(clean(item));
      return;
    }

    if(Array.isArray(item)){
      item.forEach(walk);
      return;
    }

    if(typeof item === "object"){
      Object.values(item).forEach(walk);
    }
  }

  walk(obj);
  return values;
}

function localPasskeyExists(entered){
  const localKeys = [
    "accessPasskeys",
    "impactAccessPasskeys",
    "personnelPasskeys",
    "learnerPasskeys"
  ];

  for(const key of localKeys){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) continue;

      const values = flattenValues(JSON.parse(raw));
      if(values.includes(entered)) return true;
    }catch(e){}
  }

  return false;
}

export async function validatePasskey(inputPasskey, requestedGate){
  const entered = clean(inputPasskey);

  if(!entered){
    return { ok:false, message:"Please enter your passkey." };
  }

  if(localPasskeyExists(entered)){
    return {
      ok:true,
      role: requestedGate,
      ownerName: requestedGate === "learnerHub" ? "Learner Hub" : "Personnel"
    };
  }

  try{
    const snap = await getDocs(collection(db, "accessPasskeys"));

    for(const docSnap of snap.docs){
      const data = docSnap.data();
      const values = flattenValues(data);
      values.push(clean(docSnap.id));

      if(values.includes(entered)){
        return {
          ok:true,
          role: requestedGate,
          ownerName: data.ownerName || data.name || data.teamMemberName || data.learnerName || "User"
        };
      }
    }

    return { ok:false, message:"Invalid passkey." };
  }catch(error){
    console.error(error);
    return { ok:false, message:"Could not validate passkey from Firestore." };
  }
}
