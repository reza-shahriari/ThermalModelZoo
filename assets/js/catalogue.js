// Catalogue: filtering, sorting, paging and a shareable URL state. Everything renders from models.json.
(function () {
  var PAGE_SIZE = 12;
  var $ = function (id) { return document.getElementById(id); };
  var state = { q: "", cat: [], licence: "", fmt: [], thermal: false, materials: false, webgl: false, maxTris: Infinity, sort: "new", page: 1, view: "grid" };
  var D, maxTris = 1;

  // The triangle slider is logarithmic so 10k and 5M are both reachable.
  function sliderToTris(v) { return Math.round(Math.pow(10, Math.log10(1000) + (Math.log10(Math.max(maxTris, 1001)) - 3) * v / 100)); }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = p.get("q") || "";
    state.cat = (p.get("cat") || "").split(",").filter(Boolean);
    state.licence = p.get("licence") || "";
    state.fmt = (p.get("fmt") || "").split(",").filter(Boolean);
    state.thermal = p.get("thermal") === "1"; state.materials = p.get("materials") === "1"; state.webgl = p.get("webgl") === "1";
    state.sort = p.get("sort") || "new"; state.page = Math.max(1, parseInt(p.get("page") || "1", 10) || 1); state.view = p.get("view") === "table" ? "table" : "grid";
    if (p.get("tris")) state.maxTris = parseInt(p.get("tris"), 10) || Infinity;
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat.length) p.set("cat", state.cat.join(","));
    if (state.licence) p.set("licence", state.licence);
    if (state.fmt.length) p.set("fmt", state.fmt.join(","));
    if (state.thermal) p.set("thermal", "1"); if (state.materials) p.set("materials", "1"); if (state.webgl) p.set("webgl", "1");
    if (isFinite(state.maxTris)) p.set("tris", state.maxTris);
    if (state.sort !== "new") p.set("sort", state.sort);
    if (state.page > 1) p.set("page", state.page);
    if (state.view === "table") p.set("view", "table");
    var qs = p.toString();
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  }

  function haystack(m) {
    return [m.id, m.name, m.real_name, m.summary, m.subcategory, m.author, (m.parts || []).map(function (p) { return p.name + " " + p.material; }).join(" ")].join(" ").toLowerCase();
  }
  function matches(m) {
    if (state.q) { var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean), h = haystack(m); if (!terms.every(function (t) { return h.indexOf(t) >= 0; })) return false; }
    if (state.cat.length && state.cat.indexOf(m.category) < 0) return false;
    if (state.licence && m.licence !== state.licence) return false;
    if (state.fmt.length && !TMZ.formats(m).some(function (f) { return state.fmt.indexOf(f) >= 0; })) return false;
    if (state.thermal && !TMZ.hasKind(m, "thermal")) return false;
    if (state.materials && !(m.parts && m.parts.length)) return false;
    if (state.webgl && !TMZ.hasGlb(m)) return false;
    if ((m.triangles || 0) > state.maxTris) return false;
    return true;
  }
  var SORTS = {
    "new": function (a, b) { return (b.date_added || "").localeCompare(a.date_added || "") || a.name.localeCompare(b.name); },
    "name": function (a, b) { return a.name.localeCompare(b.name); },
    "tris-asc": function (a, b) { return (a.triangles || 0) - (b.triangles || 0); },
    "tris-desc": function (a, b) { return (b.triangles || 0) - (a.triangles || 0); },
    "parts": function (a, b) { return TMZ.partCount(b) - TMZ.partCount(a); }
  };

  function checkbox(name, value, label, count, checked) {
    return '<label class="flex items-center justify-between p-1.5 rounded hover:bg-surface-container cursor-pointer select-none"><span class="flex items-center gap-2"><input type="checkbox" class="w-3.5 h-3.5 accent-primary-container" data-' + name + '="' + TMZ.esc(value) + '"' + (checked ? " checked" : "") + "/><span>" + TMZ.esc(label) + '</span></span><span class="text-on-surface-variant">' + count + "</span></label>";
  }
  function buildSidebar() {
    $("category-filter").innerHTML = D.categories.map(function (c) {
      return checkbox("cat", c.id, c.label, D.models.filter(function (m) { return m.category === c.id; }).length, state.cat.indexOf(c.id) >= 0);
    }).join("");
    $("licence-filter").innerHTML = ['<button type="button" data-licence="" class="px-2 py-1 rounded"></button>'].concat(D.licences.map(function (l) { return '<button type="button" data-licence="' + TMZ.esc(l.id) + '" class="px-2 py-1 rounded">' + TMZ.esc(l.short) + "</button>"; })).join("");
    $("licence-filter").firstChild.textContent = "All";
    var fm = {}; D.models.forEach(function (m) { TMZ.formats(m).forEach(function (f) { fm[f] = 1; }); });
    $("format-filter").innerHTML = ["blend", "usdc", "glb", "fbx"].concat(Object.keys(fm).filter(function (f) { return ["blend", "usdc", "glb", "fbx"].indexOf(f) < 0; })).map(function (f) {
      return '<label class="flex items-center gap-2 p-1.5 rounded hover:bg-surface-container cursor-pointer"><input type="checkbox" class="w-3.5 h-3.5 accent-primary-container" data-fmt="' + TMZ.esc(f) + '"' + (state.fmt.indexOf(f) >= 0 ? " checked" : "") + "/>." + TMZ.esc(f) + "</label>";
    }).join("");
  }
  function syncControls() {
    $("model-search-input").value = state.q; $("clear-search-btn").classList.toggle("hidden", !state.q);
    $("sort-select").value = state.sort;
    $("f-thermal").checked = state.thermal; $("f-materials").checked = state.materials; $("f-webgl").checked = state.webgl;
    var slider = $("tris-slider");
    if (isFinite(state.maxTris)) { var v = (Math.log10(Math.max(state.maxTris, 1000)) - 3) / (Math.log10(Math.max(maxTris, 1001)) - 3) * 100; slider.value = Math.max(0, Math.min(100, v)); } else slider.value = 100;
    $("tris-label").textContent = isFinite(state.maxTris) && slider.value < 100 ? TMZ.fmtTris(state.maxTris) : "no limit";
    Array.prototype.forEach.call(document.querySelectorAll("[data-licence]"), function (b) {
      var on = b.getAttribute("data-licence") === state.licence;
      b.className = "px-2 py-1 rounded " + (on ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container text-on-surface-variant hover:text-on-surface");
      b.setAttribute("aria-pressed", on);
    });
    var g = state.view === "grid";
    $("view-grid").className = "px-space-md flex items-center gap-1 font-mono-data-sm " + (g ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface");
    $("view-table").className = "px-space-md flex items-center gap-1 font-mono-data-sm " + (!g ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface");
    $("view-grid").setAttribute("aria-pressed", g); $("view-table").setAttribute("aria-pressed", !g);
  }

  function row(m) {
    var lic = TMZ.licence(D, m.licence);
    return '<tr class="border-t border-outline-variant/30 hover:bg-surface-container"><td class="p-2"><a class="flex items-center gap-2 text-on-surface hover:text-primary" href="' + TMZ.modelUrl(m) + '"><img class="w-14 h-10 object-cover rounded" loading="lazy" width="56" height="40" alt="" src="' + TMZ.thumbUrl(m) + '"/><span class="font-semibold">' + TMZ.esc(m.name) + (m.demo ? " " + TMZ.demoBadge() : "") + "</span></a></td>" +
      "<td class='p-2'>" + TMZ.esc(TMZ.category(D, m.category).label) + "</td><td class='p-2'>" + TMZ.esc(lic.short) + "</td><td class='p-2 text-right'>" + TMZ.fmtTris(m.triangles) + "</td><td class='p-2 text-right'>" + TMZ.partCount(m) + "</td><td class='p-2 text-right'>" + TMZ.emisText(m) + "</td><td class='p-2'>" + TMZ.esc(TMZ.formats(m).join(", ")) + "</td></tr>";
  }

  function render() {
    var list = D.models.filter(matches).sort(SORTS[state.sort] || SORTS["new"]);
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    $("result-summary").textContent = "Showing " + list.length + " of " + D.models.length + " model" + (D.models.length === 1 ? "" : "s");
    var none = !list.length, grid = state.view === "grid";
    $("no-results").classList.toggle("hidden", !none); $("no-results").classList.toggle("flex", none);
    $("grid-container").classList.toggle("hidden", none || !grid);
    $("table-container").classList.toggle("hidden", none || grid);
    $("grid-container").innerHTML = slice.map(function (m) { return TMZ.card(D, m); }).join("");
    $("table-container").innerHTML = '<table class="w-full text-left font-mono-data-sm text-mono-data-sm text-on-surface"><thead class="text-on-surface-variant uppercase font-label-caps"><tr><th class="p-2">Model</th><th class="p-2">Category</th><th class="p-2">Licence</th><th class="p-2 text-right">Triangles</th><th class="p-2 text-right">Parts</th><th class="p-2 text-right">Emissivity</th><th class="p-2">Files</th></tr></thead><tbody>' + slice.map(row).join("") + "</tbody></table>";
    var pg = "";
    if (pages > 1) {
      pg = '<div class="flex items-center gap-1">' + '<button type="button" data-page="' + (state.page - 1) + '" class="h-8 w-8 rounded bg-surface-container-low disabled:opacity-40" ' + (state.page === 1 ? "disabled" : "") + ' aria-label="Previous page"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>';
      for (var i = 1; i <= pages; i++) pg += '<button type="button" data-page="' + i + '" class="h-8 w-8 rounded font-mono-data-md ' + (i === state.page ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-low") + '"' + (i === state.page ? ' aria-current="page"' : "") + ">" + i + "</button>";
      pg += '<button type="button" data-page="' + (state.page + 1) + '" class="h-8 w-8 rounded bg-surface-container-low disabled:opacity-40" ' + (state.page === pages ? "disabled" : "") + ' aria-label="Next page"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button></div>';
    } else pg = "<span></span>";
    $("pager").innerHTML = pg + '<a class="font-mono-data-sm text-primary hover:text-secondary flex items-center gap-1" href="data/models.json" download="models.json"><span class="material-symbols-outlined text-[16px]">data_object</span>Download catalogue (models.json)</a>';
    syncControls(); writeUrl();
  }

  function resetAll() { state.q = ""; state.cat = []; state.licence = ""; state.fmt = []; state.thermal = state.materials = state.webgl = false; state.maxTris = Infinity; state.page = 1; render(); }
  function toggle(arr, v, on) { var i = arr.indexOf(v); if (on && i < 0) arr.push(v); if (!on && i >= 0) arr.splice(i, 1); }

  TMZ.load().then(function (d) {
    D = d; d.models.forEach(function (m) { if ((m.triangles || 0) > maxTris) maxTris = m.triangles; });
    readUrl(); buildSidebar();
    var t; $("model-search-input").addEventListener("input", function (e) { state.q = e.target.value.trim(); state.page = 1; clearTimeout(t); t = setTimeout(render, 120); $("clear-search-btn").classList.toggle("hidden", !e.target.value); });
    $("clear-search-btn").addEventListener("click", function () { state.q = ""; state.page = 1; render(); $("model-search-input").focus(); });
    $("sort-select").addEventListener("change", function (e) { state.sort = e.target.value; state.page = 1; render(); });
    $("view-grid").addEventListener("click", function () { state.view = "grid"; render(); });
    $("view-table").addEventListener("click", function () { state.view = "table"; render(); });
    $("f-thermal").addEventListener("change", function (e) { state.thermal = e.target.checked; state.page = 1; render(); });
    $("f-materials").addEventListener("change", function (e) { state.materials = e.target.checked; state.page = 1; render(); });
    $("f-webgl").addEventListener("change", function (e) { state.webgl = e.target.checked; state.page = 1; render(); });
    $("tris-slider").addEventListener("input", function (e) { state.maxTris = +e.target.value >= 100 ? Infinity : sliderToTris(+e.target.value); state.page = 1; render(); });
    $("reset-filters-btn").addEventListener("click", resetAll); $("clear-all-empty-btn").addEventListener("click", resetAll);
    $("filters-toggle").addEventListener("click", function (e) { var f = $("filters"), open = f.classList.toggle("hidden"); e.currentTarget.setAttribute("aria-expanded", !open); f.classList.toggle("flex", !open); });
    $("category-filter").addEventListener("change", function (e) { if (e.target.dataset.cat) { toggle(state.cat, e.target.dataset.cat, e.target.checked); state.page = 1; render(); } });
    $("format-filter").addEventListener("change", function (e) { if (e.target.dataset.fmt) { toggle(state.fmt, e.target.dataset.fmt, e.target.checked); state.page = 1; render(); } });
    $("licence-filter").addEventListener("click", function (e) { var b = e.target.closest("[data-licence]"); if (b) { state.licence = b.getAttribute("data-licence"); state.page = 1; render(); } });
    $("pager").addEventListener("click", function (e) { var b = e.target.closest("[data-page]"); if (b && !b.disabled) { state.page = +b.dataset.page; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
    render();
    if (new URLSearchParams(location.search).get("focus") === "search") $("model-search-input").focus();
  }).catch(function (e) { TMZ.showError($("grid-container"), "Could not load the catalogue: " + e.message); });
})();
