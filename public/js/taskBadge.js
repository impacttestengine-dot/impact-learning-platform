import { db } from './firebase.js'
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

export async function checkTasks(){
  const snap = await getDocs(collection(db,"tasks"))

  let pending = false
  snap.forEach(d=>{
    if(!d.data().done) pending=true
  })

  const badge = document.getElementById('taskBadge')

  if(pending){
    badge.style.animation="pulse 1s infinite"
  }
}
