import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

window.startExam = function () {
  const key = document.getElementById("examKey").value;

  if (!key) {
    document.getElementById("status").innerText = "Enter exam code";
    return;
  }

  document.getElementById("status").innerText = "Loading exam...";
};






