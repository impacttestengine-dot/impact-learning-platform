import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const PASSKEY_COLLECTIONS = [
  "passkeys",
  "access",
  "teamPasskeys",
  "personnelPasskeys",
  "learnerPasskeys",
  "configurationPasskeys"
];

function clean(value) {
  return String(value || "").trim();
}

function getPasskey(data) {
  return clean(
    data.passkey ||
    data.passKey ||
    data.key ||
    data.code ||
    data.accessCode ||
    data.password ||
    data.pin ||
    data.generatedPasskey ||
    data.generatedKey ||
    data.teamPasskey ||
    data.learnerPasskey
  );
}

function getOwnerName(data) {
  return clean(
    data.ownerName ||
    data.name ||
    data.displayName ||
    data.fullName ||
    data.teamMemberName ||
    data.memberName ||
    data.learnerName ||
    data.personnelName ||
    "User"
  );
}

export async function validatePasskey(inputPasskey, requestedRole) {
  const entered = clean(inputPasskey);

  if (!entered) {
    return {
      ok: false,
      message: "Please enter your passkey."
    };
  }

  try {
    for (const collectionName of PASSKEY_COLLECTIONS) {
      const snapshot = await getDocs(collection(db, collectionName));

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const savedPasskey = getPasskey(data);

        if (savedPasskey && savedPasskey === entered) {
          return {
            ok: true,
            role: requestedRole,
            ownerName: getOwnerName(data)
          };
        }
      }
    }

    return {
      ok: false,
      message: "Invalid passkey."
    };

  } catch (error) {
    console.error("Passkey validation failed:", error);

    return {
      ok: false,
      message: "Could not validate passkey from Firestore."
    };
  }
}
