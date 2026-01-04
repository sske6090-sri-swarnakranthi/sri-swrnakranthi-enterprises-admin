
"""
Rename/copy Twin Birds images to EAN codes based on a CSV/XLSX mapping.
- Walks the source root and tries to match (brand, model, color) against the mapping.
- If matched, copies the image to target folder with filename "<EAN><ext>".
- Leaves originals untouched.
- Supports dry-run first to review.

Usage examples (Windows):
  py rename_images.py --source "C:\Users\ganesh\Downloads\Twin Birds\Twin Birds" ^
                      --mapping "C:\path\to\TFK STORES TWIN BIRDS.xlsx" ^
                      --target "D:\shopping-admin\public\new-images" ^
                      --brand-col Brand --model-col Model --color-col Color --ean-col EAN

  # Do a dry-run first (no files written), just a report CSV:
  py rename_images.py --source "<src>" --mapping "<xlsx/csv>" --target "<dst>" --dry-run

Notes:
- Mapping file may be .xlsx or .csv.
- Color synonyms are normalized (e.g., "lava red" -> "red"). Edit COLOR_ALIASES below to add more.
- We attempt to derive model from the last folder name containing the image (e.g., "Ruffle Top", "Skirt Shaper").
- We attempt to derive color from the image filename (e.g., "Wild Rose 3.webp" -> "Wild Rose").
"""
import os
import sys
import re
import csv
import argparse
import unicodedata
from pathlib import Path
from typing import Dict, Tuple, Optional
import shutil

try:
    import pandas as pd
except ImportError:
    print("This script requires pandas. Install with: pip install pandas openpyxl")
    sys.exit(1)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".jfif", ".avif"}

# Extendable color alias table. Keys and values should be lowercase, normalized.
COLOR_ALIASES = {
    "lava red": "red",
    "wine red": "wine",
    "ruby red": "red",
    "scarlet": "red",
    "maroon": "maroon",
    "wild rose": "wild rose",
    "green tree": "green tree",
    "mehandi": "mehandi",
    "mehendi": "mehandi",
    "off white": "offwhite",
    "off-white": "offwhite",
    "light blue": "blue",
    "sky blue": "sky",
    "dark blue": "blue",
    "navy blue": "navy",
    "charcoal grey": "charcoal",
    "gray": "grey",
    "golden": "gold",
}

def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = str(s)
    s = unicodedata.normalize("NFKD", s)
    s = s.encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r'[_\-\s]+', ' ', s).strip()
    return s

def normalize_color(col: str) -> str:
    col = normalize_text(col)
    # Keep last two tokens as a phrase if present (e.g., "wild rose")
    tokens = col.split()
    if not tokens:
        return ""
    # Turn alias phrase back to canonical if present
    phrase = " ".join(tokens[-2:]) if len(tokens) >= 2 else tokens[-1]
    if phrase in COLOR_ALIASES:
        return COLOR_ALIASES[phrase]
    # Try full phrase then individual tokens
    if col in COLOR_ALIASES:
        return COLOR_ALIASES[col]
    for n in range(min(3, len(tokens)), 0, -1):
        p = " ".join(tokens[-n:])
        if p in COLOR_ALIASES:
            return COLOR_ALIASES[p]
    return col

def guess_color_from_filename(stem: str) -> str:
    # remove trailing pure numbers
    parts = [p for p in re.split(r'[\s\-\_]+', stem) if p]
    while parts and re.fullmatch(r'\d+', parts[-1]):
        parts.pop()
    if not parts:
        return ""
    # color often is the tail words after model name; take last 1-3 words that aren't numbers
    for n in (3,2,1):
        if len(parts) >= n:
            candidate = " ".join(parts[-n:])
            norm = normalize_color(candidate)
            if norm:
                return norm
    return normalize_color(" ".join(parts[-2:]))

def derive_model_from_path(path: Path, source_root: Path) -> str:
    # e.g., ...\TOPS\TOPS\Ruffle Top\White 1.webp -> model="Ruffle Top"
    # Take the immediate parent directory of the file.
    try:
        model = path.parent.name
        return model
    except Exception:
        return ""

def build_mapping(df: "pd.DataFrame", brand_col: str, model_col: str, color_col: str, ean_col: str) -> Dict[Tuple[str,str,str], str]:
    mapping = {}
    for _, row in df.iterrows():
        brand = normalize_text(row.get(brand_col, ""))
        model = normalize_text(row.get(model_col, ""))
        color = normalize_color(row.get(color_col, ""))
        ean = str(row.get(ean_col, "")).strip()
        if not ean:
            continue
        key = (brand, model, color)
        # Keep the first EAN for a key; warn if duplicates later
        if key not in mapping:
            mapping[key] = ean
    return mapping

def load_mapping(mapping_path: Path, brand_col: str, model_col: str, color_col: str, ean_col: str) -> Dict[Tuple[str,str,str], str]:
    if mapping_path.suffix.lower() in (".xlsx", ".xls"):
        df = pd.read_excel(mapping_path, dtype=str)
    else:
        df = pd.read_csv(mapping_path, dtype=str, encoding="utf-8")
    return build_mapping(df, brand_col, model_col, color_col, ean_col)

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def unique_name(target_dir: Path, base_name: str, ext: str) -> Path:
    candidate = target_dir / f"{base_name}{ext}"
    i = 2
    while candidate.exists():
        candidate = target_dir / f"{base_name}_{i}{ext}"
        i += 1
    return candidate

def main():
    ap = argparse.ArgumentParser(description="Rename/copy images to EAN codes based on mapping.")
    ap.add_argument("--source", required=True, help="Root folder containing product images (will be walked recursively).")
    ap.add_argument("--mapping", required=True, help="Mapping file (.xlsx or .csv) with Brand/Model/Color/EAN columns.")
    ap.add_argument("--target", required=True, help="Destination folder (flat) to copy renamed images into.")
    ap.add_argument("--brand-col", default="Brand", help="Column name for Brand in the mapping file.")
    ap.add_argument("--model-col", default="Model", help="Column name for Model in the mapping file.")
    ap.add_argument("--color-col", default="Color", help="Column name for Color in the mapping file.")
    ap.add_argument("--ean-col", default="EAN", help="Column name for EAN code in the mapping file.")
    ap.add_argument("--brand-fixed", default="twin birds", help="If brand is always same in images, set it here (normalized). Leave blank to infer from mapping only.")
    ap.add_argument("--dry-run", action="store_true", help="Do not write files; only generate report.")
    args = ap.parse_args()

    source_root = Path(args.source)
    mapping_path = Path(args.mapping)
    target_dir = Path(args.target)

    if not source_root.exists():
        print(f"Source not found: {source_root}")
        sys.exit(1)
    if not mapping_path.exists():
        print(f"Mapping not found: {mapping_path}")
        sys.exit(1)

    mapping = load_mapping(mapping_path, args.brand_col, args.model_col, args.color_col, args.ean_col)
    print(f"Loaded {len(mapping)} mapping rows.")

    ensure_dir(target_dir)

    report_rows = []
    unmatched = 0
    matched = 0

    for dirpath, _, filenames in os.walk(source_root):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in IMAGE_EXTS:
                continue
            full = Path(dirpath) / fname
            rel = full.relative_to(source_root)

            stem = Path(fname).stem
            model = derive_model_from_path(full, source_root)
            color = guess_color_from_filename(stem)

            brand_norm = normalize_text(args.brand_fixed) if args.brand_fixed else ""
            model_norm = normalize_text(model)
            color_norm = normalize_color(color)

            key = (brand_norm, model_norm, color_norm)
            ean = mapping.get(key)

            status = "NO_MATCH"
            new_path = ""
            if ean:
                matched += 1
                out_path = unique_name(target_dir, ean, ext)
                new_path = str(out_path)
                status = "MATCHED"
                if not args.dry_run:
                    shutil.copy2(full, out_path)
            else:
                unmatched += 1

            report_rows.append({
                "status": status,
                "source_full_path": str(full),
                "relative_path": str(rel),
                "derived_brand": brand_norm,
                "derived_model": model,
                "derived_color": color,
                "normalized_key": "|".join([brand_norm, model_norm, color_norm]),
                "ean": ean or "",
                "target_full_path": new_path
            })

    # Always write a report CSV
    report_csv = Path("rename_report.csv")
    with report_csv.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=list(report_rows[0].keys()) if report_rows else
            ["status","source_full_path","relative_path","derived_brand","derived_model","derived_color","normalized_key","ean","target_full_path"])
        writer.writeheader()
        for r in report_rows:
            writer.writerow(r)

    print(f"Done. Matched: {matched}, Unmatched: {unmatched}. Report: {report_csv.resolve()}")
    if args.dry_run:
        print("Dry-run only. No files were written.")
    else:
        print(f"Files copied to: {target_dir}")

if __name__ == "__main__":
    main()
