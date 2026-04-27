import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

function normalize(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function readPasskey(data) {
  return normalize(
    data.passkey ||
    data.passKey ||
    data.key ||
    data.code ||
    data.accessCode ||
    data.password ||
    data.pin
  );
}

function readRole(data) {
  return normalizeRole(
    data.role ||
    data.category ||
    data.accessType ||
    data.type ||
    data.userType ||
    data.gate ||
    data.access ||
    ""
  );
}

function readOwner(data) {
  return normalize(
    data.ownerName ||
    data.name ||
    data.displayName ||
    data.fullName ||
    data.teamMemberName ||
    data.learnerName ||
    "User"
  );
}

function allowedForGate(savedRole, requestedRole) {
  const gate = normalizeRole(requestedRole);

  const personnelRoles = [
    "personnel",
    "personnels",
    "teacher",
    "teachers",
    "team",
    "teammember",
    "impactteamlead",
    "admin"
  ];

  const learnerRoles = [
    "learner",
    "learners",
    "learnerhub",
    "impactlearner",
    "impactlearners",
    "student",
    "students"
  ];

  // If role was not stored clearly, accept the passkey.
  if (!savedRole) return true;

  // Personnel gate accepts personnel/team passkeys AND learner passkeys.
  if (gate === "personnel" || gate === "teacher") {
    return personnelRoles.includes(savedRole) || learnerRoles.includes(savedRole);
  }

  // Learner Hub gate accepts learner passkeys AND personnel passkeys.
  if (gate === "learnerhub" || gate === "learner" || gate === "impactlearner" || gate === "impactlearners") {
    return learnerRoles.includes(savedRole) || personnelRoles.includes(savedRole);
  }

  return true;
}

export async function validatePasskey(inputPasskey, requestedRole) {
  const entered = normalize(inputPasskey);

  if (!entered) {
    return {
      ok: false,
      message: "Please enter your passkey."
    };
  }

  try {
    const snapshot = await getDocs(collection(db, "passkeys"));

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const savedPasskey = readPasskey(data);
      const savedRole = readRole(data);
      const ownerName = readOwner(data);

      if (savedPasskey === entered && allowedForGate(savedRole, requestedRole)) {
        return {
          ok: true,
          role: requestedRole,
          ownerName
        };
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
