// Shared header, footer, theme toggle and keyboard shortcuts. Each page has
// <div id="site-header"></div> and <div id="site-footer"></div> and <body data-page="...">.
(function () {
  var REPO = "https://github.com/reza-shahriari/ThermalModelZoo";
  var NAV = [
    ["home", "index.html", "Home"],
    ["catalogue", "catalogue.html", "Browse Catalogue"],
    ["licences", "licences.html", "Licences & Criteria"],
    ["contribute", "contribute.html", "Contribute"],
    ["about", "about.html", "About & Methodology"]
  ];
  var page = document.body.getAttribute("data-page") || "";

  var logo = '<svg class="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<rect x="1" y="1" width="30" height="30" rx="4" stroke="rgb(var(--c-outline-variant))"/>' +
    '<circle cx="16" cy="16" r="6" stroke="rgb(var(--c-primary-container))" stroke-width="2"/>' +
    '<circle cx="16" cy="16" r="2" fill="rgb(var(--c-primary-container))"/>' +
    '<path d="M16 3v6M16 23v6M3 16h6M23 16h6" stroke="rgb(var(--c-primary-container))" stroke-width="2"/></svg>';

  function link(item, mobile) {
    var on = item[0] === page;
    var cls = mobile
      ? "min-h-[44px] px-space-md flex items-center font-body-md text-body-md rounded hover:bg-surface-container-highest " + (on ? "text-primary font-semibold" : "text-on-surface-variant hover:text-on-surface")
      : "px-space-md py-space-xs font-body-md text-body-md transition-colors rounded " + (on ? "bg-primary-container text-on-primary-container font-semibold" : "text-on-surface-variant hover:text-on-surface");
    return '<a class="' + cls + '" href="' + item[1] + '"' + (on ? ' aria-current="page"' : "") + ">" + item[2].replace("&", "&amp;") + "</a>";
  }

  var header =
    '<header class="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">' +
    '<div class="h-16 w-full px-gutter flex items-center justify-between gap-space-md">' +
    '<a class="flex items-center gap-space-sm shrink-0" href="index.html" aria-label="Thermal Model Zoo, home">' + logo +
    '<span class="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">Thermal Model Zoo</span></a>' +
    '<nav class="hidden lg:flex items-center gap-space-xs" aria-label="Main">' + NAV.map(function (n) { return link(n, false); }).join("") + "</nav>" +
    '<div class="flex items-center gap-space-sm shrink-0">' +
    '<a class="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded flex items-center gap-space-xs transition-colors" href="catalogue.html?focus=search" title="Search the catalogue (press /)">' +
    '<span class="material-symbols-outlined text-[18px]">search</span><span class="hidden sm:inline font-mono-data-sm text-mono-data-sm">Search ( / )</span></a>' +
    '<button id="theme-toggle" class="h-8 w-8 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded flex items-center justify-center transition-colors" type="button" aria-label="Toggle light and dark theme"><span class="material-symbols-outlined text-[18px]" id="theme-icon">light_mode</span></button>' +
    '<a class="h-8 w-8 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded flex items-center justify-center transition-colors" href="' + REPO + '" rel="noopener" target="_blank" title="Source repository on GitHub" aria-label="GitHub repository"><span class="material-symbols-outlined text-[18px]">code</span></a>' +
    '<details class="lg:hidden relative"><summary class="h-8 w-8 bg-surface-container hover:bg-surface-container-high text-on-surface rounded flex items-center justify-center cursor-pointer" aria-label="Menu"><span class="material-symbols-outlined text-[20px]">menu</span></summary>' +
    '<div class="absolute right-0 mt-space-sm w-64 p-space-sm bg-surface-container-high rounded shadow-xl flex flex-col gap-space-xs z-50">' + NAV.map(function (n) { return link(n, true); }).join("") + "</div></details>" +
    "</div></div></header>";

  var footer =
    '<footer class="w-full bg-surface-container-lowest text-on-surface-variant mt-auto border-t border-outline-variant/30">' +
    '<div class="max-w-7xl mx-auto px-gutter py-space-xl grid grid-cols-1 md:grid-cols-2 gap-space-lg">' +
    '<div class="flex flex-col gap-space-sm"><span class="font-label-caps text-label-caps text-primary uppercase">Thermal Model Zoo &middot; static site</span>' +
    '<p class="font-body-md text-body-md">Open 3D models prepared for thermal-infrared camera simulation: real part decomposition, researched per-part materials, and a clear licence and credit on every entry.</p>' +
    '<p class="font-body-sm text-body-sm">Every model remains the property of its creator and is shared under the licence shown on its page. Modified versions credit the original and say what changed. No analytics and no cookies are used by this site.</p></div>' +
    '<div class="flex flex-col md:items-end gap-space-sm font-mono-data-sm text-mono-data-sm">' +
    '<nav class="flex flex-wrap gap-x-space-lg gap-y-space-xs md:justify-end" aria-label="Footer">' +
    '<a class="hover:text-primary" href="' + REPO + '" target="_blank" rel="noopener">GitHub repo</a>' +
    '<a class="hover:text-primary" href="licences.html">Licences</a>' +
    '<a class="hover:text-primary" href="licences.html#takedown">Takedown policy</a>' +
    '<a class="hover:text-primary" href="contribute.html">Contribute</a>' +
    '<a class="hover:text-primary" href="about.html">About</a></nav>' +
    '<span class="text-outline">Models are listed in <a class="underline hover:text-primary" href="data/models.json">data/models.json</a></span></div></div></footer>';

  var h = document.getElementById("site-header"), f = document.getElementById("site-footer");
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;

  function syncIcon() {
    var i = document.getElementById("theme-icon");
    if (i) i.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "dark_mode" : "light_mode";
  }
  syncIcon();
  var tb = document.getElementById("theme-toggle");
  if (tb) tb.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("tmz-theme", next); } catch (e) {}
    syncIcon();
  });

  // "/" or Ctrl/Cmd+K jumps to the search box (or opens the catalogue's).
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      var box = document.getElementById("model-search-input");
      e.preventDefault();
      if (box) box.focus(); else location.href = "catalogue.html?focus=search";
    }
  });
})();
