import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

function clean(value){
  return String(value || "").trim();
}

function roleClean(value){
  return clean(value).toLowerCase().replace(/\s+/g,"").replace(/-/g,"");
}

function canEnterGate(data, gate){
  const role = roleClean(data.role);
  const scope = roleClean(data.accessScope);
  const canAccessTeacher = data.canAccessTeacher === true;
  const canAccessLearner = data.canAccessLearner === true;

  if(gate === "personnel"){
    return canAccessTeacher || scope === "team" || role.includes("teacher") || role.includes("personnel") || role.includes("team") || role.includes("operations") || role.includes("lead");
  }

  if(gate === "learnerHub"){
    return canAccessLearner || scope === "learner" || scope === "team" || role.includes("learner") || role.includes("teacher") || role.includes("personnel") || role.includes("team") || role.includes("operations") || role.includes("lead");
  }

  return false;
}

export async function validatePasskey(inputPasskey, requestedGate){
  const entered = clean(inputPasskey);

  if(!entered){
    return { ok:false, message:"Please enter your passkey." };
  }

  try{
    const snap = await getDocs(collection(db, "accessPasskeys"));

    for(const docSnap of snap.docs){
      const data = docSnap.data();
      const saved = clean(data.passkey);

      if(saved === entered && canEnterGate(data, requestedGate)){
        return {
          ok:true,
          role: requestedGate,
          ownerName: data.ownerName || data.name || "User"
        };
      }
    }

    return { ok:false, message:"Invalid passkey." };
  }catch(error){
    console.error(error);
    return { ok:false, message:"Could not validate passkey from Firestore." };
  }
}
