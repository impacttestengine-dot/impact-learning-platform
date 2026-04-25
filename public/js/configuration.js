import { API_BASE_URL } from "/js/api-config.js";

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ownerName = value("ownerName");
  const role = value("role");
  const status = value("status") || "active";

  if(!ownerName || !role){
    formStatus.textContent = "Please enter the team member name and role.";
    return;
  }

  formStatus.textContent = "Generating passkey...";

  try{
    const response = await fetch(`${API_BASE_URL}/api/passkeys/create`, {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        ownerName,
        role,
        status
      })
    });

    const data = await response.json();

    if(!data.ok){
      formStatus.textContent = data.message || "Could not generate passkey.";
      return;
    }

    currentGeneratedPasskey = data.passkey;
    generatedKey.textContent = data.passkey;
    generatedBox.classList.remove("hidden");
    formStatus.textContent = "Passkey generated and saved.";
    copyStatus.textContent = "";

  }catch(error){
    console.error(error);
    formStatus.textContent = "Could not connect to backend. Make sure backend is running.";
  }
});

copyBtn.addEventListener("click", async () => {
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
