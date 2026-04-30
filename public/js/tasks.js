import { db } from './firebase.js';
import { collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.addTask = async () => {
    await addDoc(collection(db, "tasks"), {
        title: taskTitle.value,
        teacher: teacher.value,
        due: date.value,
        status: "pending"
    });
    loadTasks();
};

async function loadTasks() {
    const snap = await getDocs(collection(db, "tasks"));
    const list = document.getElementById('tasksList');

    list.innerHTML = "";

    snap.forEach(d => {
        const t = d.data();

        list.innerHTML += 
            <div>
                 - 
                <button onclick="complete('')">Done</button>
            </div>
        ;
    });
}

window.complete = async (id) => {
    await updateDoc(doc(db, "tasks", id), { status: "done" });
    loadTasks();
};

loadTasks();
