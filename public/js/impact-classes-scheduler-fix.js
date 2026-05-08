(function(){
  function fieldByLabel(labelText){
    const labels = Array.from(document.querySelectorAll("label"));
    const label = labels.find(l => (l.textContent || "").trim().toLowerCase() === labelText.toLowerCase());
    if(!label) return null;
    const wrap = label.closest("div") || label.parentElement;
    return wrap ? wrap.querySelector("input, select, textarea") : null;
  }

  function findButton(text){
    return Array.from(document.querySelectorAll("button")).find(b => (b.textContent || "").trim().toLowerCase() === text.toLowerCase());
  }

  function init(){
    if(!window.firebase || !firebase.firestore){
      setTimeout(init, 700);
      return;
    }

    const db = firebase.firestore();

    const level = fieldByLabel("Level");
    const learner = fieldByLabel("Learner");
    const teacher = fieldByLabel("Teacher");
    const date = fieldByLabel("Date");
    const day = fieldByLabel("Day");
    const time = fieldByLabel("Time");
    const duration = fieldByLabel("Duration");
    const meetRoom = fieldByLabel("Google Meet Room");
    const status = fieldByLabel("Status");
    const notes = fieldByLabel("Class Notes");
    const saveBtn = findButton("Save Class");

    if(!saveBtn || !meetRoom) return;

    let currentClassId = new URLSearchParams(location.search).get("edit") || "";

    function selectedDateKey(){
      return (date && date.value) ? date.value : ((day && day.value) ? day.value : "");
    }

    function cleanRoomText(text){
      return String(text || "").replace(/\s*—\s*unavailable.*$/i,"").trim();
    }

    function showRoomHint(message){
      let hint = document.getElementById("meetRoomAvailabilityHint");
      if(!hint){
        hint = document.createElement("div");
        hint.id = "meetRoomAvailabilityHint";
        hint.style.cssText = "margin-top:7px;font-size:.72rem;font-weight:800;color:rgba(255,255,255,.48);line-height:1.35;";
        meetRoom.insertAdjacentElement("afterend", hint);
      }
      hint.textContent = message || "";
    }

    async function getClasses(){
      const snap = await db.collection("classes").get();
      return snap.docs.map(d => ({ id:d.id, ...d.data() }));
    }

    async function refreshRoomAvailability(){
      const dateKey = selectedDateKey();
      const timeKey = time ? time.value : "";

      if(!dateKey || !timeKey){
        showRoomHint("Select date/day and time first to check room availability.");
        return;
      }

      const classes = await getClasses();

      Array.from(meetRoom.options).forEach(opt => {
        const roomName = cleanRoomText(opt.textContent || opt.value);
        opt.disabled = false;
        opt.textContent = roomName;

        const taken = classes.some(c =>
          c.id !== currentClassId &&
          String(c.dateKey || c.date || c.day || "") === String(dateKey) &&
          String(c.time || "") === String(timeKey) &&
          String(c.meetRoom || c.googleMeetRoom || "") === String(roomName) &&
          String(c.status || "").toLowerCase() !== "cancelled"
        );

        if(taken){
          opt.disabled = true;
          opt.textContent = roomName + " — unavailable at selected time";
        }
      });

      showRoomHint("Unavailable rooms are greyed out for the selected date/day and time.");
    }

    async function saveClass(e){
      e.preventDefault();
      e.stopPropagation();

      const roomName = meetRoom.options[meetRoom.selectedIndex] ? cleanRoomText(meetRoom.options[meetRoom.selectedIndex].textContent) : meetRoom.value;
      const dateKey = selectedDateKey();
      const timeKey = time ? time.value : "";

      await refreshRoomAvailability();

      if(meetRoom.options[meetRoom.selectedIndex] && meetRoom.options[meetRoom.selectedIndex].disabled){
        alert("This Google Meet room is unavailable at the selected date/day and time.");
        return;
      }

      const record = {
        level: level ? level.value : "",
        learner: learner ? learner.value : "",
        teacher: teacher ? teacher.value : "",
        date: date ? date.value : "",
        day: day ? day.value : "",
        dateKey,
        time: timeKey,
        duration: duration ? duration.value : "",
        meetRoom: roomName,
        googleMeetRoom: roomName,
        status: status ? status.value : "Scheduled",
        notes: notes ? notes.value : "",
        updatedAt: new Date().toISOString()
      };

      if(currentClassId){
        await db.collection("classes").doc(currentClassId).set(record,{merge:true});
      }else{
        const ref = await db.collection("classes").add({
          ...record,
          createdAt: new Date().toISOString()
        });
        currentClassId = ref.id;
        history.replaceState(null,"","/teacher/classes.html?edit=" + currentClassId);
      }

      saveBtn.textContent = "Saved ✓";
      setTimeout(()=>saveBtn.textContent = "Save Class", 1400);
      await refreshRoomAvailability();
    }

    saveBtn.onclick = null;
    saveBtn.addEventListener("click", saveClass, true);

    [date, day, time].forEach(el => {
      if(el){
        el.addEventListener("change", refreshRoomAvailability);
        el.addEventListener("input", refreshRoomAvailability);
      }
    });

    meetRoom.addEventListener("focus", refreshRoomAvailability);
    meetRoom.addEventListener("click", refreshRoomAvailability);

    refreshRoomAvailability();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
