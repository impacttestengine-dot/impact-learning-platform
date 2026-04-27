(function(){
  if (document.querySelector(".impact-global-blur-bg")) return;

  const bg = document.createElement("div");
  bg.className = "impact-global-blur-bg";
  document.body.prepend(bg);
})();
