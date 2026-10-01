#!/usr/bin/env python3
"""Draw labelled placeholder images for the demo entries in data/models.json.

They are deliberately schematic and say PLACEHOLDER on them: the demo entries are not real models
and must not be mistaken for renders of one. Real entries ship WebP/JPG renders instead.
Run:  python3 tools/make_placeholders.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 900

SHAPES = {  # (cold geometry, hot spots as (cx, cy, r))
    "drones": ("""<g><rect x="520" y="400" width="160" height="110" rx="18"/>
        <path d="M520 420 L300 270 M680 420 L900 270 M520 490 L300 640 M680 490 L900 640" stroke-width="22" stroke-linecap="round" fill="none"/>
        <circle cx="290" cy="260" r="70"/><circle cx="910" cy="260" r="70"/><circle cx="290" cy="650" r="70"/><circle cx="910" cy="650" r="70"/></g>""",
               [(290, 260, 55), (910, 260, 55), (290, 650, 55), (910, 650, 55), (600, 455, 70)]),
    "ground": ("""<g><path d="M150 560 L230 430 Q260 380 330 375 L560 365 Q640 360 700 410 L820 440 Q1000 460 1050 560 L1050 600 L150 600 Z"/>
        <circle cx="330" cy="610" r="80"/><circle cx="870" cy="610" r="80"/></g>""",
               [(330, 610, 62), (870, 610, 62), (1000, 590, 36), (800, 470, 70)]),
    "aircraft": ("""<g><path d="M120 460 Q150 430 300 430 L1000 430 Q1090 440 1090 470 Q1090 500 1000 510 L300 510 Q150 510 120 460 Z"/>
        <path d="M520 470 L760 150 L840 150 L760 470 Z"/><path d="M520 470 L760 790 L840 790 L760 470 Z"/>
        <path d="M980 440 L1060 300 L1110 300 L1080 440 Z"/></g>""",
                 [(640, 330, 46), (640, 610, 46), (150, 465, 40)]),
}
SHAPES["ships"] = SHAPES["props"] = SHAPES["animals"] = SHAPES["infrastructure"] = SHAPES["ground"]


def svg(kind, category, label):
    geo, hot = SHAPES.get(category, SHAPES["ground"])
    defs = ""
    body = ""
    if kind == "thermal":
        glows = "".join(f'<circle cx="{x}" cy="{y}" r="{r*2.4}" fill="url(#g)"/>' for x, y, r in hot)
        defs = '<radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.35" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        body = f'<g fill="#5a6270" stroke="none" opacity=".85">{geo}</g>{glows}'
        bg = "#0b0d10"
    elif kind == "wireframe":
        body = f'<g fill="none" stroke="#38bdf8" stroke-width="2.5" opacity=".9">{geo}</g>'
        bg = "#0a0e13"
    elif kind == "emissivity":
        body = f'<g fill="#9aa2ad" stroke="none">{geo}</g>'
        bg = "#101419"
    else:  # beauty
        body = f'<g fill="#3a424d" stroke="#6b7684" stroke-width="3">{geo}</g>'
        bg = "#15191f"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Placeholder {kind} image">
<defs>{defs}</defs><rect width="{W}" height="{H}" fill="{bg}"/>
<g stroke="#ffffff" stroke-opacity=".05">{"".join(f'<path d="M{x} 0V{H}"/>' for x in range(0, W, 60))}{"".join(f'<path d="M0 {y}H{W}"/>' for y in range(0, H, 60))}</g>
{body}
<text x="600" y="{H-150}" text-anchor="middle" fill="#ffc174" font-family="monospace" font-size="34" letter-spacing="4">PLACEHOLDER · {kind.upper()}</text>
<text x="600" y="{H-100}" text-anchor="middle" fill="#8a94a3" font-family="monospace" font-size="26">{label} · not a real model</text></svg>"""


data = json.loads((ROOT / "data/models.json").read_text())
for m in data["models"]:
    if not m.get("demo"):
        continue
    out = ROOT / "models" / m["id"]
    out.mkdir(parents=True, exist_ok=True)
    for im in m["images"]:
        (out / im["file"]).write_text(svg(im["kind"], m["category"], m["name"]))
    (out / m["thumb"]).write_text(svg("thermal", m["category"], m["name"]))
    print("wrote", out)
