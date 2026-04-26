import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/js/firebase-app.js";

let folders = [];
let lessons = [];
let builder = [];

async function load(){
  let f = await getDocs(collection(db,"lessonFolders"));
  f.forEach(d=>folders.push({id:d.id,...d.data()}));

  let l = await getDocs(collection(db,"lessons"));
  l.forEach(d=>lessons.push({id:d.id,...d.data()}));

  render();
}

function render(){
  document.getElementById("folders").innerHTML =
    folders.map(f=>`<div>${f.name}</div>`).join("");

  document.getElementById("lessons").innerHTML =
    lessons.map(l=>`<div>${l.title}</div>`).join("");
}

window.openFolder = async function(){
  let name = prompt("Folder name");
  if(!name) return;

  await addDoc(collection(db,"lessonFolders"),{
    name
  });

  location.reload();
}

window.openBuilder = function(){
  let title = prompt("Lesson Title");

  let content = prompt("Lesson Content / Steps");

  let resource = prompt("Add Resource (link or text)");

  addDoc(collection(db,"lessons"),{
    title,
    content,
    resource,
    personnel:"assigned",
    impactLearner Hub:"group",
    createdAt:new Date().toISOString()
  });

  alert("Lesson created");
}

window.openTracker = function(){
  alert("Total Lessons: " + lessons.length);
}

load();



