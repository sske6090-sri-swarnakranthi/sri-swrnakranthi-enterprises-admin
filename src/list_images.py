import os
import csv
import sys
import re
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".jfif", ".avif"}

COLOR_WORDS = {
    "black","white","red","blue","green","yellow","orange","pink","purple","violet","indigo",
    "brown","beige","cream","grey","gray","silver","gold","maroon","navy","teal","olive",
    "lavender","magenta","cyan","peach","mustard","wine","mint","sky","turquoise",
    "mehandi","mehendi","mehandi-maroon","maroon","wild","rose","wild-rose","green-tree",
    "tree","lilac","rust","khaki","tan","charcoal","offwhite","off-white","ivory"
}

def clean_token(s: str) -> str:
    s = re.sub(r'[_\-]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s

def guess_color(filename_stem: str) -> str:
    tokens = [t for t in re.split(r'[\s\-\_]+', filename_stem) if t]
    while tokens and re.fullmatch(r'\d+', tokens[-1]):
        tokens.pop()
    for n in (3,2,1):
        if len(tokens) >= n:
            phrase = " ".join(tokens[-n:]).lower()
            phrase_norm = clean_token(phrase)
            if phrase_norm in COLOR_WORDS:
                return phrase
            words = phrase_norm.split()
            if any(w in COLOR_WORDS for w in words):
                return phrase
    return ""

def main():
    if len(sys.argv) < 2:
        print("Usage: py list_images.py <root_folder>")
        sys.exit(1)
    root = Path(sys.argv[1]).expanduser()
    if not root.exists():
        print(f"Root not found: {root}")
        sys.exit(1)

    rows = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            if ext in IMAGE_EXTS:
                full = Path(dirpath) / f
                rel = full.relative_to(root)
                stem = Path(f).stem
                color_guess = guess_color(stem)
                rows.append({
                    "full_path": str(full),
                    "relative_path": str(rel),
                    "folder": str(Path(dirpath)),
                    "filename": f,
                    "stem": stem,
                    "ext": ext,
                    "color_guess": color_guess
                })

    out = Path("image_inventory.csv")
    with out.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=list(rows[0].keys()) if rows else
            ["full_path","relative_path","folder","filename","stem","ext","color_guess"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print(f"Wrote {len(rows)} rows to {out.resolve()}")

if __name__ == "__main__":
    main()
