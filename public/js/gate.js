function validatePasskey(inputKey) {
  const keys = JSON.parse(localStorage.getItem("passkeys") || "[]");

  const match = keys.find(k => k.key === inputKey);

  if (!match) return false;

  if (match.role === "learners") {
    window.location.href = "learner-hub.html";
  } else {
    window.location.href = "dashboard.html";
  }

  return true;
}
