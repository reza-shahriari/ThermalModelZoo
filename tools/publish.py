#!/usr/bin/env python3
"""Publish one model to the zoo from a bundle folder: web images, hosted files, catalogue entry.

    python3 tools/publish.py path/to/bundle                 # GitHub Releases (default)
    python3 tools/publish.py path/to/bundle --host hf       # Hugging Face dataset instead
    python3 tools/publish.py path/to/bundle --dry-run       # everything except the upload
    python3 tools/publish.py --remove demo-quadrotor        # take an entry (and its images) out

A bundle is a folder:

    entry.json        the site fields (see README "Entry fields"); leave out images, thumb and
                      downloads -- this script fills them. Optional "captions": {"beauty": "..."}.
    images/           beauty.*, thermal.*, wireframe.*, emissivity.*, extra*.*  (png / jpg / webp)
    files/            the downloads, uploaded as they are (.blend, .fbx, .glb, .usdz, .zip, ...)
    ATTRIBUTION.md    uploaded beside the files; required for anything that is not your own work

What it does, in order: checks the entry against the licence rules, converts the images to WebP
(<= 1200 px wide, <= 600 kB) into models/<id>/, hashes the files, uploads them, writes the entry
into data/models.json (replacing an entry with the same id), and runs tools/validate.py. It does
not commit; it prints the git commands to run.

Hosts. GitHub Releases needs the `gh` CLI logged in; each model gets a release tagged
`model-<id>`, files up to 2 GB each. Hugging Face needs `pip install huggingface_hub` and
`hf auth login`; files go to the dataset repo given by --hf-repo under `<id>/`, with no practical
size limit -- the better home for large environments. Re-running replaces files of the same name.

Needs Pillow for the images (`pip install pillow`); the rest is the standard library.
"""
import argparse
import datetime
import hashlib
import io
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE = ROOT / "data" / "models.json"
REPO = "reza-shahriari/ThermalModelZoo"
MAX_W, MAX_BYTES, THUMB_W = 1200, 590_000, 640
KIND_ORDER = ["beauty", "thermal", "wireframe", "emissivity", "extra"]
CAPTIONS = {"beauty": "Beauty render", "thermal": "Synthetic LWIR, white-hot", "wireframe": "Parts view, one colour per part",
            "emissivity": "LWIR emissivity map", "extra": "Extra view"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
SIMPLE = (str, int, float, bool, type(None))


def die(msg):
    sys.exit(f"publish: {msg}")


# ---------------------------------------------------------------------------------------------
# models.json in its hand-written layout: one key per line inside a model, one line per list item
# ---------------------------------------------------------------------------------------------
def _j(v):
    return json.dumps(v, ensure_ascii=False)


def _eps(x):
    """Emissivities read as 0.90, not 0.9, and keep any third digit (0.845)."""
    return f"{x:.2f}" if isinstance(x, float) and round(x, 2) == x else _j(x)


def _inline(v):
    if isinstance(v, dict):
        return "{" + ", ".join(f"{_j(k)}: {_eps(x) if k == 'emissivity' else _inline(x)}" for k, x in v.items()) + "}"
    if isinstance(v, list):
        return "[" + ", ".join(_inline(x) for x in v) + "]"
    return _j(v)


def _block(v, ind):
    """A dict one key per line; lists of dicts one item per line; everything else inline."""
    pad = " " * ind
    if isinstance(v, dict):
        rows = [f"{pad}  {_j(k)}: {_block(x, ind + 2).lstrip()}" for k, x in v.items()]
        return pad + "{\n" + ",\n".join(rows) + "\n" + pad + "}"
    if isinstance(v, list) and v and not all(isinstance(x, SIMPLE) for x in v):
        return pad + "[\n" + ",\n".join(pad + "  " + _inline(x) for x in v) + "\n" + pad + "]"
    return pad + _inline(v)


def dump_catalogue(d):
    out = []
    for k, v in d.items():
        if k == "models":
            body = ",\n".join(_block(m, 4) for m in v)
            out.append(f'  "models": [\n{body}\n  ]' if v else '  "models": []')
        else:
            out.append(f"  {_j(k)}: {_block(v, 2).lstrip()}")
    return "{\n" + ",\n".join(out) + "\n}\n"


# ---------------------------------------------------------------------------------------------
def to_webp(src, dst, width):
    try:
        from PIL import Image
    except ImportError:
        die("Pillow is needed for the images: pip install pillow")
    im = Image.open(src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    for q in (88, 82, 76, 70, 62, 54, 46):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            dst.write_bytes(buf.getvalue())
            return
    die(f"{src.name} will not fit in {MAX_BYTES // 1000} kB even at low quality; crop or shrink it")


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fmt_of(p):
    """`x.blend` -> blend, `x.usdc.zip` -> usdc.zip: the label the model page shows."""
    sfx = [s.lstrip(".") for s in p.suffixes[-2:]]
    return ".".join(sfx) if len(sfx) == 2 and sfx[1] == "zip" else sfx[-1]


def run(cmd, check=True):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if check and r.returncode:
        die(f"{' '.join(cmd[:3])} failed:\n{r.stderr.strip()}")
    return r


def upload_github(mid, entry, files, attribution):
    if not shutil.which("gh"):
        die("the GitHub CLI `gh` is needed for --host github (https://cli.github.com), then `gh auth login`")
    tag = f"model-{mid}"
    notes = f"{entry['name']} for the Thermal Model Zoo -- https://reza-shahriari.github.io/ThermalModelZoo/model.html?id={mid}\n\n"
    notes += f"Licence {entry['licence']}. Original by {entry.get('author') or 'the contributor'}" + (f": {entry['source_url']}" if entry.get("source_url") else "") + ".\n"
    notes += "Keep ATTRIBUTION.md with the files when you reshare them."
    if run(["gh", "release", "view", tag, "-R", REPO], check=False).returncode:
        run(["gh", "release", "create", tag, "-R", REPO, "--title", entry["name"], "--notes", notes])
    run(["gh", "release", "upload", tag, "-R", REPO, "--clobber", *map(str, files + ([attribution] if attribution else []))])
    return "GitHub Releases", lambda f: f"https://github.com/{REPO}/releases/download/{tag}/{f.name}"


def upload_hf(mid, entry, files, attribution, hf_repo):
    try:
        from huggingface_hub import HfApi
    except ImportError:
        die("--host hf needs `pip install huggingface_hub` and `hf auth login`")
    api = HfApi()
    api.create_repo(hf_repo, repo_type="dataset", exist_ok=True)
    for f in files + ([attribution] if attribution else []):
        print(f"  uploading {f.name} ...")
        api.upload_file(path_or_fileobj=str(f), path_in_repo=f"{mid}/{f.name}", repo_id=hf_repo, repo_type="dataset",
                        commit_message=f"{mid}: {f.name}")
    return "Hugging Face", lambda f: f"https://huggingface.co/datasets/{hf_repo}/resolve/main/{mid}/{f.name}"


# ---------------------------------------------------------------------------------------------
def publish(a):
    b = Path(a.bundle).resolve()
    if not (b / "entry.json").is_file():
        die(f"{b} has no entry.json")
    e = json.loads((b / "entry.json").read_text())
    captions = e.pop("captions", {})
    d = json.loads(CATALOGUE.read_text())
    mid = e.get("id", "")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,59}", mid):
        die(f"id {mid!r}: lowercase letters, digits and hyphens")
    cats = [c["id"] for c in d["categories"]]
    if e.get("category") not in cats:
        die(f"category {e.get('category')!r} is not one of {cats} (add it to data/models.json first)")
    attribution = b / "ATTRIBUTION.md"
    if e.get("licence") != "OWN" and not attribution.is_file():
        die("ATTRIBUTION.md is required for a model that is not your own work")

    # images -> models/<id>/
    imgs = sorted(p for p in (b / "images").glob("*") if p.suffix.lower() in IMAGE_EXT) if (b / "images").is_dir() else []
    def kind_of(p):
        k = re.sub(r"[-_ ]?\d+$", "", p.stem)
        return k if k in KIND_ORDER else "extra"
    imgs.sort(key=lambda p: (KIND_ORDER.index(kind_of(p)), p.name))
    if not imgs:
        die("images/ is empty; a beauty render at least is needed")
    out = ROOT / "models" / mid
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    e["images"] = []
    for p in imgs:
        to_webp(p, out / (p.stem + ".webp"), MAX_W)
        e["images"].append({"file": p.stem + ".webp", "kind": kind_of(p), "caption": captions.get(p.stem, CAPTIONS[kind_of(p)])})
        print(f"  image  {p.name} -> models/{mid}/{p.stem}.webp ({(out / (p.stem + '.webp')).stat().st_size // 1000} kB)")
    to_webp(imgs[0], out / "thumb.webp", THUMB_W)
    e["thumb"] = "thumb.webp"

    # files -> host
    files = sorted(p for p in (b / "files").glob("*") if p.is_file()) if (b / "files").is_dir() else []
    meta = []
    for f in files:
        meta.append((f, sha256(f), round(f.stat().st_size / 1e6, 1)))
        print(f"  file   {f.name}  {meta[-1][2]} MB  sha256 {meta[-1][1][:12]}...")
        if f.stat().st_size >= 2_000_000_000 and a.host == "github":
            die(f"{f.name} is over GitHub's 2 GB release-asset limit; use --host hf")
    if a.dry_run or not files:
        host, url = ("(not uploaded: dry run)" if files else ""), (lambda f: "")
    elif a.host == "github":
        host, url = upload_github(mid, e, files, attribution if attribution.is_file() else None)
    else:
        host, url = upload_hf(mid, e, files, attribution if attribution.is_file() else None, a.hf_repo)
    e["downloads"] = [{"format": fmt_of(f), "url": url(f), "host": host, "size_mb": mb, "sha256": h} for f, h, mb in meta]

    # entry -> catalogue, keeping the field order the README documents
    e.setdefault("date_added", datetime.date.today().isoformat())
    e.pop("demo", None)
    order = ["id", "featured", "name", "real_name", "category", "subcategory", "summary", "licence", "author", "author_url",
             "source_url", "changes", "dimensions_m", "triangles", "date_added", "thumb", "images", "parts", "downloads", "viewer_glb"]
    e = {k: e[k] for k in order if k in e} | {k: v for k, v in e.items() if k not in order}
    old = [i for i, m in enumerate(d["models"]) if m.get("id") == mid]
    if old:
        e["date_added"] = d["models"][old[0]].get("date_added", e["date_added"])
        d["models"][old[0]] = e
    else:
        d["models"].insert(0, e)
    CATALOGUE.write_text(dump_catalogue(d))
    print(f"\n{'updated' if old else 'added'} {mid} in data/models.json")
    return finish(mid)


def remove(mid):
    d = json.loads(CATALOGUE.read_text())
    n = len(d["models"])
    d["models"] = [m for m in d["models"] if m.get("id") != mid]
    if len(d["models"]) == n:
        die(f"no entry {mid!r}")
    CATALOGUE.write_text(dump_catalogue(d))
    shutil.rmtree(ROOT / "models" / mid, ignore_errors=True)
    print(f"removed {mid} (its release or Hugging Face files, if any, are left in place)")
    return finish(mid)


def finish(mid):
    sys.stdout.flush()
    r = subprocess.run([sys.executable, str(ROOT / "tools" / "validate.py")])
    if r.returncode:
        print("\nvalidate.py found problems; fix them before committing.")
        return 1
    print(f"\nNext:\n  python3 -m http.server 8000   # look at http://localhost:8000/model.html?id={mid}\n"
          f"  git add data/models.json models/{mid} && git commit -m 'model: {mid}' && git push")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle", nargs="?", help="bundle folder (entry.json, images/, files/, ATTRIBUTION.md)")
    ap.add_argument("--host", choices=["github", "hf"], default="github", help="where the model files go (default github)")
    ap.add_argument("--hf-repo", default=REPO, help=f"Hugging Face dataset repo for --host hf (default {REPO})")
    ap.add_argument("--dry-run", action="store_true", help="do everything except upload; download links stay empty")
    ap.add_argument("--remove", metavar="ID", help="remove an entry and its images instead")
    a = ap.parse_args()
    if a.remove:
        return remove(a.remove)
    if not a.bundle:
        ap.error("give a bundle folder or --remove ID")
    return publish(a)


if __name__ == "__main__":
    sys.exit(main())
