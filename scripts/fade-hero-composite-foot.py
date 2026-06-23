#!/usr/bin/env python3
"""Fade hero-arch-composite foot into cream #FDFBF7 (step 4)."""
from __future__ import annotations
import argparse
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/assets/wedding/hero/hero-arch-composite.png"
BACKUP = ROOT / "public/assets/wedding/hero/hero-arch-composite.backup.png"
CREAM = (253, 251, 247)

def smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)

def fade_foot(im: Image.Image, blend_start: float = 0.58, max_mix: float = 0.88) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    y0 = int(h * blend_start)
    px = im.load()
    for y in range(y0, h):
        t = smoothstep((y - y0) / max(1, h - 1 - y0))
        mix = t * max_mix
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (
                int(r * (1 - mix) + CREAM[0] * mix),
                int(g * (1 - mix) + CREAM[1] * mix),
                int(b * (1 - mix) + CREAM[2] * mix),
                a,
            )
    return im

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--blend-start", type=float, default=0.58)
    ap.add_argument("--max-mix", type=float, default=0.88)
    args = ap.parse_args()
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")
    print(f"Loading {SRC}...")
    im = Image.open(SRC)
    out = fade_foot(im, args.blend_start, args.max_mix)
    if args.dry_run:
        dest = SRC.with_name("hero-arch-composite.faded.png")
        out.save(dest, optimize=True)
        print(f"Dry run: {dest}")
        return
    if not BACKUP.exists():
        shutil.copy2(SRC, BACKUP)
        print(f"Backup: {BACKUP}")
    out.save(SRC, optimize=True)
    print(f"Updated: {SRC}")

if __name__ == "__main__":
    main()
