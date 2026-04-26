document.addEventListener("DOMContentLoaded", () => {
  const bodyText = document.body.innerText || "";
  if (!bodyText.toUpperCase().includes("IMPACT") || !bodyText.toUpperCase().includes("PLATFORM")) return;

  if (document.querySelector(".impact-visible-ornament")) return;

  const headings = Array.from(document.querySelectorAll("h1, h2, h3, div, span, p"));
  const impactEl = headings.find((el) => el.textContent.trim().toUpperCase() === "IMPACT");
  const learningEl = headings.find((el) => el.textContent.trim().toUpperCase() === "LEARNING");
  const platformEl = headings.find((el) => el.textContent.trim().toUpperCase() === "PLATFORM");

  if (learningEl) {
    learningEl.innerHTML = '<span class="impact-visible-ornament"><span class="line"></span><span class="diamond"></span><span class="line"></span></span>';
    return;
  }

  if (impactEl && platformEl) {
    impactEl.insertAdjacentHTML(
      "afterend",
      '<span class="impact-visible-ornament"><span class="line"></span><span class="diamond"></span><span class="line"></span></span>'
    );
  }
});




