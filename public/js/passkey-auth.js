import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const LOCAL_PASSKEYS = [
  {
    passkey: "IMP-PBN8329-YX",
    role: "personnel",
    ownerName: "Personnel"
  }
];

function normalize(value) {
  return String(value || "").trim();
}

function roleAliases(role) {
  const clean = normalize(role).toLowerCase();

  if (clean === "personnel" || clean === "teacher") {
    return ["personnel", "teacher"];
  }

  if (
    clean === "learner" ||
    clean === "impactlearner" ||
    clean === "impactlearners" ||
    clean === "learnerhub"
  ) {
    return ["learner", "impactLearner", "impactLearners", "learnerHub"];
  }

  return [role];
}

function checkLocalPasskeys(entered, requestedRole) {
  const allowedRoles = roleAliases(requestedRole).map(r => normalize(r).toLowerCase());

  const match = LOCAL_PASSKEYS.find(item => normalize(item.passkey) === entered);

  if (!match) return null;

  const savedRole = normalize(match.role).toLowerCase();

  if (!savedRole || allowedRoles.includes(savedRole)) {
    return {
      ok: true,
      role: requestedRole,
      ownerName: match.ownerName || "User"
    };
  }

  return {
    ok: false,
    message: "This passkey exists but is not assigned to this access area."
  };
}

export async function validatePasskey(inputPasskey, requestedRole) {
  const entered = normalize(inputPasskey);

  if (!entered) {
    return {
      ok: false,
      message: "Please enter your passkey."
    };
  }

  const localResult = checkLocalPasskeys(entered, requestedRole);
  if (localResult) return localResult;

  try {
    const allowedRoles = roleAliases(requestedRole).map(r => normalize(r).toLowerCase());
    const snapshot = await getDocs(collection(db, "passkeys"));

    let fallbackMatch = null;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      const savedPasskey = normalize(
        data.passkey ||
        data.key ||
        data.code ||
        data.password ||
        data.pin ||
        data.passKey ||
        data.accessCode
      );

      const savedRole = normalize(
        data.role ||
        data.category ||
        data.accessType ||
        data.type ||
        data.userType
      ).toLowerCase();

      const ownerName = normalize(
        data.ownerName ||
        data.name ||
        data.displayName ||
        data.fullName ||
        "User"
      );

      if (savedPasskey === entered) {
        fallbackMatch = { role: savedRole, ownerName };

        if (!savedRole || allowedRoles.includes(savedRole)) {
          return {
            ok: true,
            role: requestedRole,
            ownerName
          };
        }
      }
    }

    if (fallbackMatch) {
      return {
        ok: false,
        message: "This passkey exists but is not assigned to this access area."
      };
    }

    return {
      ok: false,
      message: "Invalid passkey."
    };

  } catch (error) {
    console.error("Passkey validation failed:", error);

    const backupResult = checkLocalPasskeys(entered, requestedRole);
    if (backupResult) return backupResult;

    return {
      ok: false,
      message: "Could not validate passkey from Firestore."
    };
  }
}


