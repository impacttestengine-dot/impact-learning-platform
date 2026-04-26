import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

export async function validatePasskey(inputPasskey, targetSide){
  const passkey = String(inputPasskey || "").trim();

  if(!passkey){
    return { ok:false, message:"Please enter your passkey." };
  }

  try{
    const q = query(
      collection(db, "accessPasskeys"),
      where("passkey", "==", passkey),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){
      return { ok:false, message:"Invalid passkey." };
    }

    const data = snapshot.docs[0].data();

    if(targetSide === "personnel" && data.canAccesspersonnel !== true){
      return { ok:false, message:"This passkey cannot open the personnel side." };
    }

    if(targetSide === "impactLearners" && data.canAccessimpactLearners !== true){
      return { ok:false, message:"This passkey cannot open the impactLearners side." };
    }

    return {
      ok:true,
      role:data.role || "",
      ownerName:data.ownerName || "",
      message:"Access granted."
    };

  }catch(error){
    console.error(error);
    return {
      ok:false,
      message:"Could not validate passkey from Firestore."
    };
  }
}




