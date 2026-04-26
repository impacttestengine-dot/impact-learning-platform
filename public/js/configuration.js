import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

const form = document.getElementById("passkeyForm");
const formStatus = document.getElementById("formStatus");
const generatedBox = document.getElementById("generatedBox");
const generatedKey = document.getElementById("generatedKey");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");

let currentGeneratedPasskey = "";

function value(id){
  return (document.getElementById(id)?.value || "").trim();
}

function generatePasskey(){
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "$&";

  const partA = Array.from({length:3}, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const partB = Array.from({length:3}, () => numbers[Math.floor(Math.random() * numbers.length)]).join("");
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const partC = Array.from({length:2}, () => letters[Math.floor(Math.random() * letters.length)]).join("");

  return `IMP-${partA}${symbol}${partB}-${partC}`;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ownerName = value("ownerName");
  const role = value("role");
  const status = value("status") || "active";

  if(!ownerName || !role){
    formStatus.textContent = "Please enter the team member name and role.";
    return;
  }

  formStatus.textContent = "Generating passkey...";

  const teamRoles = [
    "personnel",
    "academic-team-lead",
    "operations",
    "impact-team-lead"
  ];

  const isTeamRole = teamRoles.includes(role);
  const passkey = generatePasskey();

  try{
    await addDoc(collection(db, "accessPasskeys"), {
      ownerName,
      role,
      passkey,
      status,
      accessScope:isTeamRole ? "team" : "impactLearners",
      canAccesspersonnel:isTeamRole,
      canAccessimpactLearners:true,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });

    currentGeneratedPasskey = passkey;
    generatedKey.textContent = passkey;
    generatedBox.classList.remove("hidden");
    formStatus.textContent = "Passkey generated and saved.";
    copyStatus.textContent = "";

  }catch(error){
    console.error(error);
    formStatus.textContent = "Could not generate passkey in Firestore.";
  }
});

copyBtn?.addEventListener("click", async () => {
  if(!currentGeneratedPasskey){
    copyStatus.textContent = "No passkey to copy.";
    return;
  }

  try{
    await navigator.clipboard.writeText(currentGeneratedPasskey);
    copyStatus.textContent = "Passkey copied successfully.";

    setTimeout(() => {
      form.reset();
      document.getElementById("status").value = "active";
      generatedBox.classList.add("hidden");
      generatedKey.textContent = "";
      currentGeneratedPasskey = "";
      formStatus.textContent = "";
      copyStatus.textContent = "";
    }, 1300);

  }catch(error){
    console.error(error);
    copyStatus.textContent = "Could not copy. Please copy manually.";
  }
});
