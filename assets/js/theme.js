// Runs synchronously in <head> so the saved theme is applied before first paint (no flash).
(function () {
  var t = "dark";
  try { t = localStorage.getItem("tmz-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); } catch (e) {}
  document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
})();
