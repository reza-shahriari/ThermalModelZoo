// Home: quick filters, statistics, featured / recent models and category tiles, all from models.json.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  TMZ.load().then(function (d) {
    var models = d.models;

    // Quick filters link into the catalogue with the filter already applied.
    var qf = $("quick-filters");
    d.categories.slice(0, 3).forEach(function (c) {
      qf.insertAdjacentHTML("beforeend", '<a class="px-space-sm py-1 bg-surface-container hover:bg-surface-container-high rounded text-on-surface transition-colors flex items-center gap-1" href="catalogue.html?cat=' + c.id + '"><span class="material-symbols-outlined text-[14px]">' + TMZ.esc(c.icon) + "</span>" + TMZ.esc(c.label) + "</a>");
    });
    qf.insertAdjacentHTML("beforeend", '<a class="px-space-sm py-1 bg-surface-container hover:bg-surface-container-high rounded text-tertiary transition-colors flex items-center gap-1" href="catalogue.html?licence=CC0-1.0"><span class="material-symbols-outlined text-[14px]">lock_open</span>CC0 public domain</a>');

    // Statistics are computed, never typed in.
    var parts = models.reduce(function (n, m) { return n + TMZ.partCount(m); }, 0);
    var lic = {}; models.forEach(function (m) { lic[m.licence] = 1; });
    var demos = models.filter(function (m) { return m.demo; }).length;
    function tile(label, value, sub) {
      return '<div class="bg-surface-container-low rounded p-space-md flex flex-col gap-1"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">' + label +
        '</span><span class="font-mono-data-lg text-mono-data-lg text-primary" style="font-size:28px;line-height:34px">' + value + '</span><span class="font-body-sm text-on-surface-variant">' + sub + "</span></div>";
    }
    $("stats").innerHTML = tile("Models", models.length, "listed in the catalogue") + tile("Separate parts", parts, "each with a material and emissivity") +
      tile("Categories", d.categories.filter(function (c) { return models.some(function (m) { return m.category === c.id; }); }).length, "of " + d.categories.length + " available") +
      tile("Licences", Object.keys(lic).length, "CC0, CC-BY, CC-BY-SA or own work");
    if (demos) $("stats-note").textContent = "These counts include " + demos + " placeholder example" + (demos > 1 ? "s" : "") + " that show the layout; they are not real models.";

    var feat = models.filter(function (m) { return m.featured; });
    if (!feat.length) feat = models.slice(0, 3);
    $("featured").innerHTML = feat.slice(0, 3).map(function (m) { return TMZ.card(d, m); }).join("") || '<p class="text-on-surface-variant">No models yet.</p>';

    $("categories").innerHTML = d.categories.map(function (c) {
      var n = models.filter(function (m) { return m.category === c.id; }).length;
      return '<a class="bg-surface-container-low hover:bg-surface-container rounded p-space-md flex flex-col gap-space-xs transition-colors" href="catalogue.html?cat=' + c.id + '"><span class="material-symbols-outlined text-primary">' + TMZ.esc(c.icon) +
        '</span><span class="font-headline-sm text-headline-sm">' + TMZ.esc(c.label) + '</span><span class="font-mono-data-sm text-on-surface-variant">' + n + " model" + (n === 1 ? "" : "s") + "</span></a>";
    }).join("");

    var recent = models.slice().sort(function (a, b) { return (b.date_added || "").localeCompare(a.date_added || ""); }).slice(0, 4);
    $("recent").innerHTML = recent.map(function (m) { return TMZ.card(d, m); }).join("");
  }).catch(function (e) { TMZ.showError($("featured"), "Could not load the catalogue: " + e.message); });
})();
