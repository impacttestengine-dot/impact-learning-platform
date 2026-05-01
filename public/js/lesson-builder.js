const canvas = document.getElementById('canvas');

let lessonData = JSON.parse(localStorage.getItem('lessonDraft') || '[]');

function renderCanvas() {
  canvas.innerHTML = "";

  lessonData.forEach((block, index) => {
    const div = document.createElement('div');
    div.className = "block";
    div.dataset.index = index;

    div.innerHTML = 
      <div class="block-content"></div>
      <button class="delete-btn">Delete</button>
    ;

    canvas.appendChild(div);
  });
}

// EVENT DELEGATION (FIX DELETE)
canvas.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const index = e.target.parentElement.dataset.index;
    lessonData.splice(index, 1);
    saveDraft();
    renderCanvas();
  }
});

// SAVE (FIX PERSISTENCE)
function saveDraft() {
  localStorage.setItem("lessonDraft", JSON.stringify(lessonData));
}

// AUTO SAVE LIKE GOOGLE DOCS
setInterval(() => {
  saveDraft();
  console.log("Auto-saved...");
}, 2000);

// INIT
renderCanvas();
