import { db } from './firebase.js'
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let startTime = null

export function startClass(){
  startTime = new Date()
}

export async function endClass(){
  const endTime = new Date()

  const participation = calculateParticipation()

  await addDoc(collection(db,"kpiLogs"),{
    date: new Date(),
    startTime,
    endTime,
    participation,
    punctuality: calculatePunctuality(startTime),
    progress: 0,
    taskCompletion: 0
  })

  alert("Report saved")
}

function calculateParticipation(){
  const checks = document.querySelectorAll('.participation input:checked')
  return Math.round((checks.length / 6) * 100)
}

function calculatePunctuality(start){
  const scheduled = new Date(start)
  scheduled.setMinutes(0)

  const diff = (start - scheduled)/60000

  if(diff <= 5) return 100
  if(diff <= 10) return 70
  return 40
}
