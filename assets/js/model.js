// Model page: one template for every entry, rendered from data/models.json by ?id=<model id>.
(function () {
  var root = document.getElementById("model-root");
  var KIND = { beauty: "Beauty render", thermal: "Synthetic LWIR (white-hot)", wireframe: "Parts / wireframe", emissivity: "Emissivity map", extra: "Extra", video: "Turntable video" };
  var SRC = { measured: ["MEASURED", "text-emerald-400"], reference: ["REFERENCE", "text-tertiary"], estimated: ["ESTIMATED", "text-outline"] };
  var E = TMZ.esc, D, M, shots = [], cur = 0;

  function chip(label, value, cls) {
    return '<div class="px-space-sm py-1 rounded bg-surface-container font-mono-data-sm text-mono-data-sm flex items-center gap-1.5"><span class="text-on-surface-variant">' + label + '</span><span class="font-medium ' + (cls || "text-on-surface") + '">' + value + "</span></div>";
  }
  function fact(label, value, sub) {
    return '<div class="flex flex-col gap-0.5"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">' + label + '</span><span class="font-mono-data-lg text-mono-data-lg text-on-surface">' + value + "</span>" + (sub ? '<span class="font-body-sm text-on-surface-variant">' + sub + "</span>" : "") + "</div>";
  }
  function extLink(url, text) { var u = TMZ.safeUrl(url); return u ? '<a class="text-primary underline hover:text-secondary break-all" href="' + E(u) + '" target="_blank" rel="noopener noreferrer">' + E(text || u) + "</a>" : E(text || "—"); }

  function creditLine() {
    var lic = TMZ.licence(D, M.licence), by = M.author || "an unknown author";
    var orig = TMZ.safeUrl(M.source_url);
    var s = "“" + M.name + "” by " + by + (orig ? " (" + orig + ")" : "") + (M.changes && !M.demo ? ", modified for thermal simulation" : "") + ", via Thermal Model Zoo, licensed under " + lic.name + (lic.url ? " (" + lic.url + ")" : "") + ".";
    return s;
  }

  function downloads() {
    var rows = (M.downloads || []).map(function (d) {
      var u = TMZ.safeUrl(d.url), size = d.size_mb ? d.size_mb + " MB" : "size n/a";
      var sha = d.sha256 ? '<div class="flex items-center gap-1 font-mono-data-sm text-on-surface-variant"><span>SHA-256 ' + E(d.sha256.slice(0, 8)) + "…" + E(d.sha256.slice(-6)) + '</span><button type="button" class="copy-sha px-1 rounded hover:text-primary" data-sha="' + E(d.sha256) + '" aria-label="Copy SHA-256"><span class="material-symbols-outlined text-[14px]">content_copy</span></button></div>' : '<div class="font-mono-data-sm text-outline">SHA-256 not recorded</div>';
      return '<div class="bg-surface-container-low rounded p-space-md flex flex-col gap-space-sm"><div class="flex items-center justify-between"><span class="font-headline-sm text-headline-sm">.' + E(d.format) + '</span><span class="font-mono-data-sm text-on-surface-variant">' + size + "</span></div>" +
        '<div class="font-body-sm text-on-surface-variant">Hosted on ' + E(d.host || "—") + "</div>" + sha +
        (u ? '<a class="h-9 bg-primary-container hover:bg-secondary-container text-on-primary-container font-mono-data-md font-semibold rounded flex items-center justify-center gap-1 transition-colors" href="' + E(u) + '" rel="noopener noreferrer"><span class="material-symbols-outlined text-[16px]">download</span>Download .' + E(d.format) + "</a>"
           : '<span class="h-9 bg-surface-container text-outline rounded flex items-center justify-center font-mono-data-md">Not uploaded yet</span>') + "</div>";
    }).join("");
    return rows || '<p class="text-on-surface-variant">No files are listed for this model.</p>';
  }

  function partsTable(sortKey, dir) {
    var ps = (M.parts || []).slice();
    if (sortKey) ps.sort(function (a, b) { var x = a[sortKey], y = b[sortKey]; var r = typeof x === "number" ? x - y : String(x).localeCompare(String(y)); return dir * r; });
    return ps.map(function (p) {
      var s = SRC[p.source] || SRC.estimated;
      return '<tr class="border-t border-outline-variant/30 hover:bg-surface-container"><td class="p-2 font-semibold">' + E(p.name) + '</td><td class="p-2 text-on-surface-variant">' + E(p.material) + '</td><td class="p-2 text-right text-primary font-semibold">' + (typeof p.emissivity === "number" ? p.emissivity.toFixed(2) : "—") + '</td><td class="p-2 text-on-surface-variant">' + E(p.note || "") + '</td><td class="p-2 text-right ' + s[1] + '">' + s[0] + "</td></tr>";
    }).join("");
  }

  function show(i) {
    cur = (i + shots.length) % shots.length;
    var s = shots[cur], stage = document.getElementById("stage");
    if (s.kind === "video") stage.innerHTML = '<video class="w-full h-full object-contain" controls preload="metadata" src="' + E(s.src) + '"></video>';
    else if (s.kind === "viewer") stage.innerHTML = '<model-viewer class="w-full h-full" src="' + E(s.src) + '" camera-controls auto-rotate shadow-intensity="0.6" alt="Interactive 3D preview"></model-viewer>';
    else stage.innerHTML = '<img id="stage-img" class="w-full h-full object-contain cursor-zoom-in" src="' + E(s.src) + '" alt="' + E(s.caption) + '" width="1200" height="900"/>';
    document.getElementById("stage-cap").textContent = s.caption;
    Array.prototype.forEach.call(document.querySelectorAll("[data-shot]"), function (b) {
      var on = +b.dataset.shot === cur;
      b.className = b.className.replace(/ ?(bg-surface-container-highest text-on-surface|ring-2 ring-primary-container)/g, "");
      if (on) b.className += b.dataset.role === "tab" ? " bg-surface-container-highest text-on-surface" : " ring-2 ring-primary-container";
      b.setAttribute("aria-current", on);
    });
  }
  function lb(open) {
    var el = document.getElementById("lightbox");
    if (open) { var s = shots[cur]; if (s.kind === "viewer" || s.kind === "video") return; document.getElementById("lb-img").src = s.src; document.getElementById("lb-cap").textContent = s.caption; el.hidden = false; document.getElementById("lb-close").focus(); }
    else el.hidden = true;
  }

  function render() {
    var lic = TMZ.licence(D, M.licence), cat = TMZ.category(D, M.category);
    document.title = M.name + " — Thermal Model Zoo";
    shots = (M.images || []).map(function (im) { return { src: /^https?:/.test(im.file) ? im.file : TMZ.imgUrl(M, im.file), kind: im.kind, caption: im.caption || KIND[im.kind] || "Image" }; });
    if (M.viewer_glb) shots.push({ src: /^https?:/.test(M.viewer_glb) ? M.viewer_glb : TMZ.imgUrl(M, M.viewer_glb), kind: "viewer", caption: "Interactive 3D preview (drag to orbit)" });
    var first = (M.downloads || []).filter(function (d) { return TMZ.safeUrl(d.url); })[0];
    var rel = D.models.filter(function (m) { return m.id !== M.id && m.category === M.category; }).concat(D.models.filter(function (m) { return m.id !== M.id && m.category !== M.category; })).slice(0, 4);
    var r = TMZ.emisRange(M);

    root.innerHTML =
      '<div class="w-full bg-surface-container-low px-gutter py-space-sm"><nav class="max-w-7xl mx-auto flex items-center gap-space-xs font-mono-data-sm text-on-surface-variant flex-wrap" aria-label="Breadcrumb"><a class="hover:text-primary" href="catalogue.html">Models</a><span class="text-outline">/</span><a class="hover:text-primary" href="catalogue.html?cat=' + E(M.category) + '">' + E(cat.label) + '</a><span class="text-outline">/</span><span class="text-on-surface font-medium">' + E(M.id) + "</span></nav></div>" +
      '<div class="max-w-7xl mx-auto w-full px-gutter py-space-lg flex flex-col gap-space-xl">' +
      (M.demo ? TMZ.demoNotice() : "") +
      '<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg"><div class="flex flex-col gap-space-xs max-w-3xl">' +
      '<h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">' + E(M.name) + "</h1>" +
      (M.real_name ? '<p class="font-body-lg text-body-lg text-on-surface-variant">' + E(M.real_name) + "</p>" : "") +
      '<p class="font-body-md text-on-surface-variant">' + E(M.summary) + "</p>" +
      '<div class="flex flex-wrap items-center gap-space-xs pt-space-xs">' + chip("Class:", E(cat.label), "text-tertiary") + chip("Licence:", E(lic.short), "text-primary") + chip("Added:", E(M.date_added || "—")) + chip("Author:", E(M.author || "unknown")) + "</div></div>" +
      '<div class="shrink-0 flex flex-col gap-1">' + (first ? '<a class="h-10 px-space-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold rounded flex items-center gap-space-xs transition-colors" href="#downloads"><span class="material-symbols-outlined text-[18px]">download</span>Download files</a>'
        : '<a class="h-10 px-space-lg bg-surface-container text-on-surface-variant rounded flex items-center gap-space-xs" href="#downloads"><span class="material-symbols-outlined text-[18px]">schedule</span>Files not uploaded yet</a>') + "</div></div>" +

      '<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg"><div class="lg:col-span-8 flex flex-col gap-space-sm">' +
      '<div class="bg-surface-container-lowest rounded-xl p-space-sm flex flex-col gap-space-sm"><div class="flex flex-wrap gap-1 bg-surface-container-low p-1.5 rounded-lg font-mono-data-sm" role="tablist">' +
      shots.map(function (s, i) { return '<button type="button" role="tab" data-role="tab" data-shot="' + i + '" class="px-space-sm py-1.5 rounded font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container">' + (i + 1) + ". " + E(KIND[s.kind] || s.kind || "Image") + (s.kind === "viewer" ? "" : "") + "</button>"; }).join("") + "</div>" +
      '<div id="stage" class="relative w-full aspect-[4/3] bg-surface-container-lowest rounded-lg overflow-hidden flex items-center justify-center"></div>' +
      '<div class="flex items-center justify-between gap-space-sm px-1"><span id="stage-cap" class="font-mono-data-sm text-on-surface-variant"></span><span class="font-mono-data-sm text-outline hidden sm:inline">← → to browse · click image to zoom</span></div>' +
      '<div class="flex gap-space-xs overflow-x-auto scroll-thin">' + shots.map(function (s, i) { return s.kind === "viewer" || s.kind === "video" ? "" : '<button type="button" data-role="thumb" data-shot="' + i + '" class="shrink-0 w-24 h-[72px] rounded overflow-hidden bg-surface-container-low" aria-label="Show ' + E(s.caption) + '"><img class="w-full h-full object-cover" loading="lazy" width="96" height="72" alt="" src="' + E(s.src) + '"/></button>'; }).join("") + "</div></div></div>" +

      '<aside class="lg:col-span-4 flex flex-col gap-space-md"><div class="bg-surface-container-low rounded p-space-md flex flex-col gap-space-md"><h2 class="font-headline-md text-headline-md flex items-center gap-2"><span class="material-symbols-outlined text-primary">straighten</span>Technical specifications</h2>' +
      '<div class="grid grid-cols-2 gap-space-md">' + fact("Bounding box", E(TMZ.fmtDims(M.dimensions_m)), "length × width × height") + fact("Triangles", M.triangles ? M.triangles.toLocaleString("en-US") : "—") + fact("Parts", (M.parts || []).length, "separate meshes") + fact("Emissivity range", r ? r[0].toFixed(2) + " – " + r[1].toFixed(2) : "—", "LWIR 8–14 µm") + "</div>" +
      '<div class="font-body-sm text-on-surface-variant">Emissivity values are per part. Each is marked measured, reference or estimated in the table below; treat estimated values as starting points.</div></div></aside></div>' +

      '<section aria-labelledby="parts-h"><div class="flex flex-wrap items-end justify-between gap-space-sm mb-space-md"><div><span class="font-label-caps text-label-caps text-primary uppercase">Parts &amp; materials</span><h2 id="parts-h" class="font-headline-lg text-headline-lg">Functional parts and materials</h2></div><button id="csv" type="button" class="h-8 px-space-md bg-surface-container hover:bg-surface-container-high rounded font-mono-data-sm flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">download</span>Export CSV</button></div>' +
      '<div class="overflow-x-auto bg-surface-container-low rounded scroll-thin"><table class="w-full text-left font-mono-data-sm text-mono-data-sm"><thead class="text-on-surface-variant uppercase font-label-caps"><tr>' +
      '<th class="p-2"><button type="button" data-sort="name">Part</button></th><th class="p-2"><button type="button" data-sort="material">Material</button></th><th class="p-2 text-right"><button type="button" data-sort="emissivity">Emissivity (LWIR)</button></th><th class="p-2">Notes</th><th class="p-2 text-right"><button type="button" data-sort="source">Source</button></th></tr></thead><tbody id="parts-body"></tbody></table></div></section>' +

      '<section id="downloads" aria-labelledby="dl-h"><span class="font-label-caps text-label-caps text-primary uppercase">Files</span><h2 id="dl-h" class="font-headline-lg text-headline-lg mb-space-md">Downloads</h2>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">' + downloads() + "</div>" +
      '<div class="mt-space-md flex items-start gap-space-sm bg-surface-container-low rounded p-space-md font-body-md"><span class="material-symbols-outlined text-primary">verified_user</span><span>Keep <code class="font-mono-data-md text-primary">ATTRIBUTION.md</code> and the licence text with the files when you reuse or reshare them. Files are hosted by the services shown, not on this site.</span></div></section>' +

      '<section aria-labelledby="prov-h"><span class="font-label-caps text-label-caps text-primary uppercase">Provenance</span><h2 id="prov-h" class="font-headline-lg text-headline-lg mb-space-md">Author, source and modifications</h2>' +
      '<div class="bg-surface-container-low rounded p-space-lg grid grid-cols-1 md:grid-cols-3 gap-space-lg">' +
      '<div class="flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Original author</span><span class="font-headline-sm">' + (M.author_url ? extLink(M.author_url, M.author) : E(M.author || "Unknown")) + "</span></div>" +
      '<div class="flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Original model</span><span class="font-body-md">' + (M.source_url ? extLink(M.source_url) : '<span class="text-outline">No link recorded</span>') + "</span></div>" +
      '<div class="flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Licence</span><span class="font-body-md">' + (lic.url ? extLink(lic.url, lic.name) : E(lic.name)) + "</span></div>" +
      '<div class="md:col-span-3 flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Changes made for this zoo</span><p class="font-body-md">' + E(M.changes || "No changes recorded.") + "</p></div>" +
      '<div class="md:col-span-3 flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Credit line (copy this when you reuse the model)</span><div class="flex flex-col sm:flex-row gap-space-sm"><code id="credit" class="flex-1 bg-surface-container-lowest rounded p-space-sm font-mono-data-sm break-words">' + E(creditLine()) + '</code><button id="copy-credit" type="button" class="h-9 px-space-lg bg-surface-container hover:bg-surface-container-high rounded font-mono-data-md shrink-0">Copy</button></div></div></div></section>' +

      (rel.length ? '<section aria-labelledby="rel-h"><span class="font-label-caps text-label-caps text-primary uppercase">Related</span><h2 id="rel-h" class="font-headline-lg text-headline-lg mb-space-md">Related models</h2><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">' + rel.map(function (m) { return TMZ.card(D, m); }).join("") + "</div></section>" : "") +
      "</div>";

    var pb = document.getElementById("parts-body"), dir = 1, last = "";
    pb.innerHTML = partsTable();
    root.addEventListener("click", function (e) {
      var s = e.target.closest("[data-sort]"); if (s) { dir = last === s.dataset.sort ? -dir : 1; last = s.dataset.sort; pb.innerHTML = partsTable(last, dir); return; }
      var t = e.target.closest("[data-shot]"); if (t) { show(+t.dataset.shot); return; }
      var c = e.target.closest(".copy-sha"); if (c) { TMZ.copyText(c.dataset.sha, null); c.innerHTML = '<span class="material-symbols-outlined text-[14px] text-emerald-400">check</span>'; setTimeout(function () { c.innerHTML = '<span class="material-symbols-outlined text-[14px]">content_copy</span>'; }, 1500); return; }
      if (e.target.closest("#stage-img")) lb(true);
      if (e.target.closest("#copy-credit")) TMZ.copyText(creditLine(), document.getElementById("copy-credit"));
      if (e.target.closest("#csv")) {
        var rows = [["part", "material", "emissivity_lwir", "source", "note"]].concat((M.parts || []).map(function (p) { return [p.name, p.material, p.emissivity, p.source, p.note || ""]; }));
        var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = M.id + "-parts.csv"; a.click(); URL.revokeObjectURL(a.href);
      }
    });
    if (shots.length) show(0); else document.getElementById("stage").innerHTML = '<span class="text-outline font-mono-data-md">No images yet</span>';
    if (M.viewer_glb) { var s = document.createElement("script"); s.type = "module"; s.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3/dist/model-viewer.min.js"; document.head.appendChild(s); }
  }

  document.addEventListener("keydown", function (e) {
    var open = !document.getElementById("lightbox").hidden, typing = /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "");
    if (!shots.length || typing) return;
    if (e.key === "ArrowRight") { show(cur + 1); if (open) lb(true); }
    else if (e.key === "ArrowLeft") { show(cur - 1); if (open) lb(true); }
    else if (e.key === "Escape" && open) lb(false);
  });
  ["lb-close", "lb-prev", "lb-next"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () { if (id === "lb-close") lb(false); else { show(cur + (id === "lb-next" ? 1 : -1)); lb(true); } });
  });
  document.getElementById("lightbox").addEventListener("click", function (e) { if (e.target.id === "lightbox") lb(false); });

  TMZ.load().then(function (d) {
    D = d; var id = new URLSearchParams(location.search).get("id");
    M = TMZ.find(d.models, id);
    if (!M) { root.innerHTML = '<div class="max-w-3xl mx-auto px-gutter py-space-xl flex flex-col gap-space-md"><h1 class="font-headline-lg text-headline-lg">Model not found</h1><p class="text-on-surface-variant">There is no model with the id “' + E(id || "") + '”. It may have been renamed or removed.</p><a class="text-primary underline" href="catalogue.html">Back to the catalogue</a></div>'; return; }
    render();
  }).catch(function (e) { TMZ.showError(root, "Could not load the catalogue: " + e.message); });
})();
