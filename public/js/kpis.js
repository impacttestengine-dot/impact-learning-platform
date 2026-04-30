import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById('kpiContainer');

async function loadKPIs() {
    const reports = await getDocs(collection(db, "classReports"));
    const tasks = await getDocs(collection(db, "tasks"));

    let participation = 0;
    let punctuality = 0;
    let completedTasks = 0;

    reports.forEach(doc => {
        participation += doc.data().participation || 0;
        punctuality += doc.data().punctuality || 0;
    });

    tasks.forEach(doc => {
        if (doc.data().status === "done") completedTasks++;
    });

    container.innerHTML = 
        <div>Participation: %</div>
        <div>Punctuality: %</div>
        <div>Task Completion: </div>
    ;
}

loadKPIs();
