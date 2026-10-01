// Data loading and the pieces every page shares (escaping, formatting, the model card).
// All catalogue content comes from data/models.json; nothing here is per-model.
var TMZ = (function () {
  var cache = null;

  function load() {
    if (!cache) {
      cache = fetch("data/models.json", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("models.json: HTTP " + r.status);
        return r.json();
      }).then(function (d) {
        d.models.forEach(function (m) { m.tri_k = m.triangles ? m.triangles / 1000 : 0; });
        return d;
      });
    }
    return cache;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Only http(s) links from the data file are ever rendered as hrefs.
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }

  function fmtTris(n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n || 0); }
  function fmtDims(d) { return d && d.length === 3 ? d.map(function (x) { return x; }).join(" × ") + " m" : "—"; }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function licence(data, id) { return find(data.licences, id) || { id: id, short: id, name: id, url: "" }; }
  function category(data, id) { return find(data.categories, id) || { id: id, label: id, icon: "category" }; }
  function imgUrl(m, file) { return "models/" + encodeURIComponent(m.id) + "/" + encodeURIComponent(file); }
  function thumbUrl(m) { return imgUrl(m, m.thumb || (m.images[0] && m.images[0].file) || ""); }
  function modelUrl(m) { return "model.html?id=" + encodeURIComponent(m.id); }
  function formats(m) { return (m.downloads || []).map(function (d) { return d.format; }); }
  function hasKind(m, k) { return (m.images || []).some(function (i) { return i.kind === k; }); }
  function hasGlb(m) { return !!m.viewer_glb; }
  function emisRange(m) {
    var v = (m.parts || []).map(function (p) { return p.emissivity; }).filter(function (x) { return typeof x === "number"; });
    return v.length ? [Math.min.apply(null, v), Math.max.apply(null, v)] : null;
  }
  function emisText(m) { var r = emisRange(m); return r ? (r[0] === r[1] ? r[0].toFixed(2) : r[0].toFixed(2) + " – " + r[1].toFixed(2)) : "—"; }

  function demoBadge() {
    return '<span class="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps uppercase">Example</span>';
  }
  function demoNotice() {
    return '<div class="flex items-start gap-space-sm bg-error-container/30 text-on-surface px-space-md py-space-sm rounded font-body-md text-body-md" role="note">' +
      '<span class="material-symbols-outlined text-[18px] text-error">info</span>' +
      '<span><strong>Example data.</strong> This entry is a placeholder that shows how a model is presented. It is not a real model, and its files, authors and values are not real.</span></div>';
  }

  function card(data, m) {
    var lic = licence(data, m.licence), cat = category(data, m.category);
    var fmts = formats(m).map(function (f) { return '<span class="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono-data-sm text-mono-data-sm text-on-surface">.' + esc(f) + "</span>"; }).join("");
    var thermalTag = hasKind(m, "thermal") ? '<div class="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-dim/85 backdrop-blur font-mono-data-sm text-mono-data-sm text-primary"><span class="material-symbols-outlined text-[14px]">videocam</span><span>WHITE-HOT LWIR</span></div>' : "";
    return '<article class="model-card flex flex-col bg-surface-container-low rounded overflow-hidden hover:bg-surface-container transition-colors group">' +
      '<a class="relative block aspect-[4/3] w-full bg-surface-container-lowest overflow-hidden" href="' + modelUrl(m) + '" tabindex="-1" aria-hidden="true">' +
      '<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width="400" height="300" src="' + thumbUrl(m) + '" alt="' + esc(m.name) + ' thermal render"/>' +
      thermalTag +
      '<div class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-highest/90 text-on-surface font-mono-data-sm text-mono-data-sm">' + fmtTris(m.triangles) + " Δ</div>" +
      '<div class="absolute bottom-2 left-2 flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-on-surface bg-surface-dim/80 backdrop-blur px-1.5 py-0.5 rounded"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>' + esc(lic.short) + "</span></div>" +
      "</a>" +
      '<div class="p-space-md flex flex-col gap-space-xs flex-1 justify-between"><div>' +
      '<div class="flex items-center justify-between gap-2 mb-1"><span class="font-label-caps text-label-caps text-secondary uppercase">' + esc(cat.label) + (m.subcategory ? " / " + esc(m.subcategory) : "") + "</span>" +
      (m.demo ? demoBadge() : '<span class="font-mono-data-sm text-mono-data-sm text-on-surface-variant">' + esc(fmtDims(m.dimensions_m)) + "</span>") + "</div>" +
      '<h2 class="font-headline-sm text-headline-sm text-on-surface tracking-tight group-hover:text-primary transition-colors"><a href="' + modelUrl(m) + '">' + esc(m.name) + "</a></h2>" +
      (m.real_name ? '<div class="font-mono-data-sm text-mono-data-sm text-on-surface-variant">' + esc(m.real_name) + "</div>" : "") +
      '<p class="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">' + esc(m.summary) + "</p></div>" +
      '<div class="pt-space-xs flex flex-col gap-space-xs">' +
      '<div class="flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm py-1 bg-surface-container rounded px-2"><span>Parts: <span class="text-on-surface font-semibold">' + (m.parts || []).length + '</span></span><span>ε: <span class="text-primary font-semibold">' + emisText(m) + "</span></span></div>" +
      '<div class="flex items-center gap-1.5 flex-wrap min-h-[22px]">' + fmts + "</div>" +
      '<a class="h-8 bg-primary-container hover:bg-secondary-container text-on-primary-container font-mono-data-sm text-mono-data-sm font-semibold rounded flex items-center justify-center gap-1 transition-colors" href="' + modelUrl(m) + '"><span class="material-symbols-outlined text-[16px]">visibility</span><span>View parts &amp; materials</span></a>' +
      "</div></div></article>";
  }

  function copyText(text, btn, okLabel) {
    function done() { if (btn) { var o = btn.getAttribute("data-label") || btn.textContent; btn.setAttribute("data-label", o); btn.textContent = okLabel || "Copied"; setTimeout(function () { btn.textContent = o; }, 1500); } }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); }
  }

  function showError(el, msg) {
    el.innerHTML = '<div class="p-space-lg rounded bg-error-container/30 text-on-surface font-body-md" role="alert">' + esc(msg) + "</div>";
  }

  return { load: load, esc: esc, safeUrl: safeUrl, fmtTris: fmtTris, fmtDims: fmtDims, find: find, licence: licence, category: category,
           imgUrl: imgUrl, thumbUrl: thumbUrl, modelUrl: modelUrl, formats: formats, hasKind: hasKind, hasGlb: hasGlb,
           emisRange: emisRange, emisText: emisText, card: card, demoBadge: demoBadge, demoNotice: demoNotice, copyText: copyText, showError: showError };
})();
