# Thermal Model Zoo

A static website of open 3D models prepared for **thermal-infrared camera simulation**: each model is split
into its real parts, and every part lists a material and a long-wave (8–14 µm) emissivity. Every entry credits
its author, links to the original, and states the licence and what was changed.

It is plain HTML, CSS and JavaScript with no build step and no backend, so it runs on GitHub Pages.
The images and descriptions live in this repository; the large model files (`.blend`, `.usdc`, `.fbx`, `.glb`)
are hosted on free external storage (GitHub Releases, Hugging Face, Zenodo, Drive) and linked from each page.

> **Live site:** https://reza-shahriari.github.io/ThermalModelZoo/

> The three entries currently in `data/models.json` are **placeholders** (marked `"demo": true`) that show the
> layout. Delete them once real models are added.

## Run it locally

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Pages load `data/models.json` with `fetch`, so open them through a server, not from `file://`.

## Layout

```
index.html catalogue.html model.html      # model.html?id=<id> is the one template for every model
licences.html contribute.html about.html 404.html
data/models.json                          # the catalogue: one entry per model
models/<id>/                              # web-sized images only (WebP/JPG, under 600 kB each)
assets/css  assets/js                     # tokens.css + site.css, and one small script per page
tools/validate.py                         # licence / field / image checks (runs in CI)
tools/gen_tokens.py                       # design tokens -> tokens.css + tailwind-config.js
tools/make_placeholders.py                # draws the demo images
design/                                   # Stitch design system and the original screen exports
.github/                                  # CI and issue templates
```

## Add a model

1. Check the licence. Only **CC0, CC-BY, CC-BY-SA or your own work** are accepted (see `licences.html`).
2. Upload the model files to free storage and note the links and SHA-256 hashes. Include an `ATTRIBUTION.md` in the download.
3. Add `models/<slug>/` with `thumb.webp`, `beauty.webp`, `thermal.webp`, `wireframe.webp` (each ≤ 1200 px wide, ≤ 600 kB).
4. Append an entry to `data/models.json` (the Contribute page writes one for you).
5. Run `python3 tools/validate.py`, then open a pull request.

Model files are never committed here (`.gitignore` and the validator both refuse them).

## Entry fields

`id, name, real_name, category, subcategory, summary, licence (CC0-1.0 | CC-BY-4.0 | CC-BY-SA-4.0 | OWN),
author, author_url, source_url, changes, dimensions_m [L,W,H], triangles, date_added, thumb, images[{file,kind,caption}],
parts[{name,material,emissivity,source: measured|reference|estimated,note}], downloads[{format,url,host,size_mb,sha256}],
viewer_glb (optional, enables the in-browser 3D tab), featured, demo`.

## Design

The visual system is Stitch's "Radiometric Precision" (`design/DESIGN.md`). Dark is the default; a light theme
is defined in `tools/gen_tokens.py`. Edit the tokens there and re-run it; never edit `assets/css/tokens.css`
or `assets/js/tailwind-config.js` by hand.

Styling uses the Tailwind Play CDN, and fonts come from Google Fonts. Both are third-party requests; self-hosting
or compiling the CSS is the next step if that matters.

## Publish

Settings → Pages → Deploy from branch `main`, folder `/ (root)`. Links are relative, so it works under
`https://<user>.github.io/ThermalModelZoo/`.

## Licence

The site's own code and text (HTML, CSS, JavaScript, tools and documentation) are released under the
[MIT License](LICENSE).

**Models are not covered by it.** Every model keeps its author's licence (CC0, CC-BY, CC-BY-SA, or the
contributor's own CC0/CC-BY release), shown on its page and in `data/models.json`. The images in
`models/<id>/` are renders of those models and carry the same licence and credit. The Stitch design export
under `design/` is included as design reference.
