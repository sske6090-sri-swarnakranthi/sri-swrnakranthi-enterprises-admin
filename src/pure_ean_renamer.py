import argparse
import re
import sys
import shutil
import pandas as pd
from pathlib import Path
from datetime import datetime

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".jfif"}

def normalize_text(s):
    if not isinstance(s, str):
        s = str(s)
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def strip_trailing_index(name):
    return re.sub(r"[\s_\-]*([0-9]+)$", "", name).strip()

def detect_ean_column(df, user_col):
    if user_col and user_col in df.columns:
        return user_col
    cands = [c for c in df.columns if "ean" in c.lower()]
    return cands[0] if cands else None

def read_inventory(path, sheet):
    if not path.exists():
        raise FileNotFoundError(f"Inventory not found: {path}")
    if path.suffix.lower() in [".xlsx", ".xls"]:
        return pd.read_excel(path, sheet_name=sheet if sheet is not None else 0, dtype=str)
    else:
        return pd.read_csv(path, dtype=str)

def build_inventory_text(inv, text_cols):
    if text_cols:
        cols = [c for c in text_cols if c in inv.columns]
        if not cols:
            cols = [c for c in inv.columns if inv[c].dtype == "object"] or list(inv.columns)
    else:
        cols = [c for c in inv.columns if inv[c].dtype == "object"] or list(inv.columns)
    inv = inv.copy()
    inv["_combined"] = inv[cols].astype(str).agg(" ".join, axis=1)
    inv["_combined_norm"] = inv["_combined"].map(normalize_text)
    return inv

def build_image_rows(source_root):
    rows = []
    for fp in source_root.rglob("*"):
        if fp.is_file() and fp.suffix.lower() in IMG_EXTS:
            stem = fp.stem
            last = fp.parent.name
            penult = fp.parent.parent.name if fp.parent.parent else ""
            name_key = f"{penult} {last} {strip_trailing_index(stem)}".strip()
            rows.append({
                "source_path": str(fp),
                "ext": fp.suffix.lower(),
                "size": fp.stat().st_size,
                "mtime": fp.stat().st_mtime,
                "stem": stem,
                "last": last,
                "penult": penult,
                "name_key": name_key,
                "name_key_norm": normalize_text(name_key),
            })
    return pd.DataFrame(rows)

def is_valid_ean(ean):
    s = str(ean).strip()
    return s.isdigit() and 8 <= len(s) <= 14

def jaccard(a_tokens, b_tokens):
    a = set(a_tokens)
    b = set(b_tokens)
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0

def tokenize(s):
    return [t for t in normalize_text(s).split() if t]

def choose_one(paths_info, mode="largest"):
    if mode == "largest":
        return max(paths_info, key=lambda r: r["size"])
    if mode == "newest":
        return max(paths_info, key=lambda r: r["mtime"])
    return paths_info[0]

def best_match_row(inv, ean_col, candidates, thresh):
    inv_tokens = inv["_combined_norm"].apply(lambda x: x.split())
    best_idx = None
    best_score = 0.0
    for idx, row in inv.iterrows():
        bt = inv_tokens.loc[idx]
        score = 0.0
        for toks in candidates:
            score = max(score, jaccard(toks, bt))
        if score > best_score:
            best_score = score
            best_idx = idx
    if best_idx is not None and best_score >= thresh:
        return inv.iloc[best_idx][ean_col], best_score
    return None, 0.0

def main():
    ap = argparse.ArgumentParser(description="Copy images into a flat folder named exactly by EAN.")
    ap.add_argument("--source-root", required=True)
    ap.add_argument("--inventory", required=True)
    ap.add_argument("--target", required=True)
    ap.add_argument("--ean-column")
    ap.add_argument("--sheet", default=None)
    ap.add_argument("--text-cols", nargs="*")
    ap.add_argument("--choose", choices=["largest", "newest", "first"], default="largest")
    ap.add_argument("--threshold", type=float, default=0.5)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    source_root = Path(args.source_root)
    target_root = Path(args.target)
    inv_path = Path(args.inventory)

    inv = read_inventory(inv_path, args.sheet)
    ean_col = detect_ean_column(inv, args.ean_column)
    if not ean_col:
        print("ERROR: Could not detect EAN column", file=sys.stderr)
        sys.exit(2)

    inv = build_inventory_text(inv, args.text_cols)
    imgs = build_image_rows(source_root)
    if imgs.empty:
        print("No images found", file=sys.stderr)
        sys.exit(1)

    imgs["direct_ean"] = imgs["stem"].apply(lambda s: s if s.isdigit() and 8 <= len(s) <= 14 else None)
    imgs["tokens_a"] = imgs["stem"].apply(tokenize)
    imgs["tokens_b"] = (imgs["last"] + " " + imgs["stem"]).apply(tokenize)
    imgs["tokens_c"] = (imgs["penult"] + " " + imgs["last"] + " " + imgs["stem"]).apply(tokenize)

    eans = []
    scores = []
    for _, r in imgs.iterrows():
        if r["direct_ean"]:
            eans.append(r["direct_ean"])
            scores.append(1.0)
            continue
        e, sc = best_match_row(inv, ean_col, [r["tokens_c"], r["tokens_b"], r["tokens_a"]], thresh=args.threshold)
        eans.append(e)
        scores.append(sc)

    imgs["ean"] = eans
    imgs["match_score"] = scores
    imgs["ean_valid"] = imgs["ean"].map(is_valid_ean)
    valid = imgs[imgs["ean_valid"]].copy()

    chosen_rows = []
    skipped_dupes = []
    for ean, grp in valid.groupby("ean"):
        info = grp.sort_values("match_score", ascending=False).to_dict(orient="records")
        pick = choose_one(info, mode=args.choose)
        chosen_rows.append(pick)
        for r in info:
            if r is not pick:
                skipped_dupes.append(r)

    chosen = pd.DataFrame(chosen_rows)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_dir = Path.cwd()
    rename_report = report_dir / f"rename_report_{timestamp}.csv"
    skipped_report = report_dir / f"skipped_images_{timestamp}.csv"
    diagnostics = report_dir / f"diagnostics_{timestamp}.csv"

    no_ean = imgs[~imgs["ean_valid"]]
    skipped_df = pd.DataFrame(skipped_dupes)
    all_skipped = pd.concat([no_ean, skipped_df], ignore_index=True)

    diag = imgs[["source_path","stem","last","penult","ean","match_score"]].copy()
    diag.to_csv(diagnostics, index=False, encoding="utf-8")

    if not chosen.empty:
        chosen_out = chosen[["source_path", "ean", "ext", "size", "mtime", "match_score"]].copy()
        filenames = chosen_out["ean"].astype(str).str.strip() + chosen_out["ext"].str.lower()
        chosen_out["target_path"] = filenames.map(lambda n: str(target_root / n))
    else:
        chosen_out = pd.DataFrame(columns=["source_path","ean","ext","size","mtime","match_score","target_path"])

    chosen_out.to_csv(rename_report, index=False, encoding="utf-8")
    all_skipped.to_csv(skipped_report, index=False, encoding="utf-8")

    print(f"Report: {rename_report}")
    print(f"Skipped: {skipped_report}")
    print(f"Diagnostics: {diagnostics}")

    if not args.dry_run and not chosen_out.empty:
        target_root.mkdir(parents=True, exist_ok=True)
        for _, r in chosen_out.iterrows():
            src = Path(r["source_path"])
            dst = Path(r["target_path"])
            shutil.copy2(src, dst)
        print(f"Copied {len(chosen_out)} files to: {target_root}")
    elif not args.dry_run and chosen_out.empty:
        target_root.mkdir(parents=True, exist_ok=True)
        print(f"Copied 0 files to: {target_root}")
    else:
        print("Dry-run: no files copied.")

if __name__ == "__main__":
    main()
