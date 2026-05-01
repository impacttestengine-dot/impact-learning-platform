const roles = ["teachers", "academic", "operations", "learners"];

function populateRoles() {
  const select = document.getElementById("roleSelect");
  select.innerHTML = "";

  roles.forEach(role => {
    const opt = document.createElement("option");
    opt.value = role;
    opt.innerText = role;
    select.appendChild(opt);
  });
}
