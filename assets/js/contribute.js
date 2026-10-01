// Contribute: builds the GitHub-issue text and the models.json entry in the browser. Nothing is sent anywhere.
(function () {
  var REPO = "https://github.com/reza-shahriari/ThermalModelZoo";
  var MAX_URL = 7000; // GitHub rejects very long prefilled-issue URLs
  var $ = function (id) { return document.getElementById(id); };
  var D = null, slugTouched = false;

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; }
  function partRow(p) {
    p = p || {};
    return '<tr class="part-row"><td class="p-1"><input class="p-name w-full h-8 px-2 bg-surface-container-lowest rounded border border-outline-variant/40" value="' + TMZ.esc(p.name || "") + '" placeholder="chassis_frame" aria-label="Part name"/></td>' +
      '<td class="p-1"><input class="p-mat w-full h-8 px-2 bg-surface-container-lowest rounded border border-outline-variant/40" value="' + TMZ.esc(p.material || "") + '" placeholder="Matte polyurethane paint" aria-label="Material"/></td>' +
      '<td class="p-1"><input class="p-eps w-full h-8 px-2 bg-surface-container-lowest rounded border border-outline-variant/40" type="number" step="0.01" min="0" max="1" value="' + (p.emissivity == null ? "" : p.emissivity) + '" placeholder="0.94" aria-label="Emissivity"/></td>' +
      '<td class="p-1"><select class="p-src w-full h-8 px-1 bg-surface-container-lowest rounded border border-outline-variant/40" aria-label="Source"><option value="estimated">estimated</option><option value="reference"' + (p.source === "reference" ? " selected" : "") + '>reference</option><option value="measured"' + (p.source === "measured" ? " selected" : "") + '>measured</option></select></td>' +
      '<td class="p-1"><button type="button" class="p-del h-8 w-8 rounded hover:bg-surface-container text-on-surface-variant" aria-label="Remove part"><span class="material-symbols-outlined text-[16px]">close</span></button></td></tr>';
  }
  function parts() {
    return Array.prototype.map.call(document.querySelectorAll(".part-row"), function (r) {
      var e = r.querySelector(".p-eps").value;
      return { name: r.querySelector(".p-name").value.trim(), material: r.querySelector(".p-mat").value.trim(), emissivity: e === "" ? null : parseFloat(e), source: r.querySelector(".p-src").value, note: "" };
    }).filter(function (p) { return p.name || p.material || p.emissivity !== null; });
  }
  function fmts() { return Array.prototype.filter.call(document.querySelectorAll("[data-fmt]"), function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-fmt"); }); }

  function collect() {
    var h1 = $("f-host1").value.trim(), h2 = $("f-host2").value.trim(), host = function (u) { return /github\.com/.test(u) ? "GitHub Releases" : /huggingface/.test(u) ? "Hugging Face" : /zenodo/.test(u) ? "Zenodo" : /drive\.google/.test(u) ? "Google Drive" : u ? "Other" : ""; };
    var f = fmts(), dl = f.map(function (x, i) { return { format: x, url: i === 0 ? h1 : "", host: host(h1), size_mb: null, sha256: "" }; });
    var l = num("f-l"), w = num("f-w"), h = num("f-h"), id = $("f-id").value.trim() || slug($("f-name").value);
    return {
      id: id, name: $("f-name").value.trim(), real_name: $("f-real").value.trim(), category: $("f-cat").value, summary: "",
      licence: $("f-lic").value, author: $("f-author").value.trim(), author_url: $("f-author-url").value.trim(), source_url: $("f-source").value.trim(),
      changes: $("f-changes").value.trim(), dimensions_m: (l && w && h) ? [l, w, h] : null, triangles: num("f-tris"),
      date_added: new Date().toISOString().slice(0, 10), thumb: "thumb.webp",
      images: [{ file: "beauty.webp", kind: "beauty", caption: "Beauty render" }, { file: "thermal.webp", kind: "thermal", caption: "Synthetic LWIR, white-hot" }, { file: "wireframe.webp", kind: "wireframe", caption: "Parts view" }],
      parts: parts(), downloads: dl, _mirror: h2, _images_ok: $("f-images").checked, _own: $("f-own").checked
    };
  }

  function gates(m) {
    var licOk = !!m.licence && (m.licence !== "OWN" || m._own);
    var ps = m.parts, partsOk = ps.length >= 2 && ps.every(function (p) { return p.name && p.material; });
    var epsOk = ps.length > 0 && ps.every(function (p) { return typeof p.emissivity === "number" && p.emissivity > 0 && p.emissivity <= 1; });
    return [licOk, partsOk, epsOk, m._images_ok];
  }
  function required(m) { return !!(m.name && m.id && m.author && m.source_url && m.changes && /^https?:\/\//.test(m.source_url) && m.downloads.some(function (d) { return d.url; })); }

  function markdown(m, lic) {
    var rows = m.parts.map(function (p) { return "| " + [p.name, p.material, p.emissivity, p.source].join(" | ") + " |"; }).join("\n");
    return "### Model submission\n\n**Title:** " + m.name + "\n**Slug:** `" + m.id + "`\n**Real-world object:** " + (m.real_name || "—") + "\n**Category:** " + m.category + "\n**Licence:** " + lic + "\n\n" +
      "### Provenance\n\n**Original creator:** " + m.author + (m.author_url ? " (" + m.author_url + ")" : "") + "\n**Original model:** " + m.source_url + "\n**Changes made:** " + m.changes + "\n" + (m.licence === "OWN" ? "\n- [x] I made this model myself and release it as stated above.\n" : "") + "\n" +
      "### Geometry\n\n- Size (m): " + (m.dimensions_m ? m.dimensions_m.join(" × ") : "—") + "\n- Triangles: " + (m.triangles == null ? "—" : m.triangles) + "\n- Files: " + (m.downloads.map(function (d) { return "." + d.format; }).join(", ") || "—") + "\n\n" +
      "### Parts and long-wave emissivity\n\n| Part | Material | ε | Source |\n|---|---|---|---|\n" + rows + "\n\n" +
      "### Hosting\n\n- Download: " + (m.downloads[0] && m.downloads[0].url || "—") + "\n- Mirror: " + (m._mirror || "—") + "\n\n" +
      "### Checklist\n\n- [" + (m._images_ok ? "x" : " ") + "] Beauty, thermal and parts images attached\n- [ ] ATTRIBUTION.md is inside the download\n";
  }

  function update() {
    var m = collect(), lic = D ? TMZ.licence(D, m.licence).name : m.licence;
    $("own-row").classList.toggle("hidden", m.licence !== "OWN"); $("own-row").classList.toggle("flex", m.licence === "OWN");
    var g = gates(m), pass = g.filter(Boolean).length;
    g.forEach(function (ok, i) {
      var el = $("gate-" + (i + 1)), ic = el.querySelector(".gate-icon");
      ic.textContent = ok ? "check_circle" : "radio_button_unchecked"; ic.className = "material-symbols-outlined text-[20px] gate-icon " + (ok ? "text-emerald-400" : "text-outline");
    });
    $("gate-progress").textContent = pass + " / 4 passing";
    var ok = pass === 4 && required(m);
    $("valid-badge").textContent = ok ? "ready" : "incomplete"; $("valid-badge").className = "font-mono-data-sm " + (ok ? "text-emerald-400" : "text-outline");
    var md = markdown(m, lic);
    var entry = JSON.parse(JSON.stringify(m)); delete entry._mirror; delete entry._images_ok; delete entry._own;
    entry.summary = entry.summary || "One-sentence description."; if (m.dimensions_m === null) delete entry.dimensions_m;
    entry.downloads = entry.downloads.filter(function (d) { return d.url; });
    var json = JSON.stringify(entry, null, 2);
    $("preview-md").textContent = md; $("preview-json").textContent = json;
    var title = "Model submission: " + (m.name || "untitled"), url = REPO + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(md), long = url.length > MAX_URL;
    if (long) url = REPO + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent("Paste the submission text here (it was copied to your clipboard by the Contribute page).");
    var a = $("open-issue"); a.href = url; a.setAttribute("aria-disabled", ok ? "false" : "true"); a.tabIndex = ok ? 0 : -1;
    a.dataset.long = long ? "1" : "";
    $("issue-note").textContent = ok ? (long ? "The submission is too long for a link, so it will be copied to your clipboard when you click: paste it into the issue." : "Opens a new issue with everything above filled in. Attach your images there.") : "Complete the checks and required fields to enable the issue link.";
    window._tmz = { md: md, json: json };
  }

  function init() {
    $("parts").innerHTML = partRow({ name: "", material: "", source: "estimated" }) + partRow();
    var form = $("form");
    form.addEventListener("input", function (e) { if (e.target.id === "f-id") slugTouched = true; if (e.target.id === "f-name" && !slugTouched) $("f-id").value = slug(e.target.value); update(); });
    form.addEventListener("change", update);
    $("add-part").addEventListener("click", function () { $("parts").insertAdjacentHTML("beforeend", partRow()); update(); });
    $("parts").addEventListener("click", function (e) { var b = e.target.closest(".p-del"); if (b) { b.closest("tr").remove(); update(); } });
    $("copy-md").addEventListener("click", function (e) { TMZ.copyText(window._tmz.md, e.currentTarget); });
    $("copy-json").addEventListener("click", function (e) { TMZ.copyText(window._tmz.json, e.currentTarget); });
    $("open-issue").addEventListener("click", function (e) { if (e.currentTarget.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; } if (e.currentTarget.dataset.long) TMZ.copyText(window._tmz.md, null); });
    update();
  }

  TMZ.load().then(function (d) {
    D = d; $("f-cat").innerHTML = d.categories.map(function (c) { return '<option value="' + TMZ.esc(c.id) + '">' + TMZ.esc(c.label) + "</option>"; }).join("");
    init();
  }).catch(function () { $("f-cat").innerHTML = '<option value="props">Props &amp; Misc</option>'; init(); });
})();
