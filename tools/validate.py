#!/usr/bin/env python3
"""Validate data/models.json. Stdlib only; run locally and in CI on every pull request.

Rules (see licences.html): only CC0 / CC-BY / CC-BY-SA / own work, every entry credits its author and
source, every referenced image exists and is web-sized, emissivities are in (0, 1], and download links
are http(s). Exit status is non-zero on any error.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_IMAGE_BYTES = 600_000          # the site is not a file host; keep images web-sized
MAX_DATA_BYTES = 150_000_000       # hard stop on stray binaries in models/
ALLOWED = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "OWN"}
KINDS = {"beauty", "thermal", "wireframe", "emissivity", "extra", "video"}
SOURCES = {"measured", "reference", "estimated"}
BINARIES = {".blend", ".usd", ".usda", ".usdc", ".usdz", ".fbx", ".obj", ".stl", ".step", ".stp", ".zip", ".glb", ".gltf"}

errors = []


def err(model, msg):
    errors.append(f"{model}: {msg}")


def main():
    data = json.loads((ROOT / "data" / "models.json").read_text())
    cats = {c["id"] for c in data["categories"]}
    seen = set()
    for m in data["models"]:
        i = m.get("id", "<no id>")
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,59}", i):
            err(i, "id must be lowercase letters, digits and hyphens")
        if i in seen:
            err(i, "duplicate id")
        seen.add(i)
        for k in ("name", "category", "licence", "author", "changes", "date_added", "images", "parts"):
            if not m.get(k) and not (m.get("demo") and k in ("author",)):
                err(i, f"missing '{k}'")
        if m.get("category") not in cats:
            err(i, f"unknown category {m.get('category')!r}")
        if m.get("licence") not in ALLOWED:
            err(i, f"licence {m.get('licence')!r} is not accepted (allowed: {sorted(ALLOWED)})")
        if not m.get("demo"):
            if not re.match(r"https?://", m.get("source_url", "")) and m.get("licence") != "OWN":
                err(i, "source_url must be an http(s) link to the original model")
            if not m.get("author"):
                err(i, "author is required")
        for u in [m.get("author_url", "")] + [d.get("url", "") for d in m.get("downloads", [])]:
            if u and not re.match(r"https?://", u):
                err(i, f"link must be http(s): {u!r}")
        for d in m.get("downloads", []):
            if d.get("sha256") and not re.fullmatch(r"[0-9a-f]{64}", d["sha256"]):
                err(i, f"bad sha256 for .{d.get('format')}")
        for p in m.get("parts", []):
            e = p.get("emissivity")
            if not isinstance(e, (int, float)) or not 0 < e <= 1:
                err(i, f"part {p.get('name')!r}: emissivity must be in (0, 1]")
            if p.get("source") not in SOURCES:
                err(i, f"part {p.get('name')!r}: source must be one of {sorted(SOURCES)}")
        mdir = ROOT / "models" / i
        files = [m.get("thumb")] + [im.get("file") for im in m.get("images", [])]
        for im in m.get("images", []):
            if im.get("kind") not in KINDS:
                err(i, f"image {im.get('file')!r}: kind must be one of {sorted(KINDS)}")
        for f in filter(None, files):
            if re.match(r"https?://", f):
                continue
            p = mdir / f
            if not p.is_file():
                err(i, f"missing image models/{i}/{f}")
            elif p.stat().st_size > MAX_IMAGE_BYTES and p.suffix != ".mp4":
                err(i, f"{p.name} is {p.stat().st_size // 1000} kB; keep images under {MAX_IMAGE_BYTES // 1000} kB")
    # Large model files belong on Releases / Hugging Face / Zenodo, never in the repo.
    for p in (ROOT / "models").rglob("*"):
        if p.is_file() and p.suffix.lower() in BINARIES:
            err("models/", f"{p.relative_to(ROOT)} is a model file; host it externally and link it")
    total = sum(p.stat().st_size for p in (ROOT / "models").rglob("*") if p.is_file())
    if total > MAX_DATA_BYTES:
        err("models/", f"images total {total // 1_000_000} MB; the repository would outgrow GitHub Pages")
    print(f"{len(data['models'])} models checked, {len(errors)} problem(s)")
    for e in errors:
        print("  ERROR", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
