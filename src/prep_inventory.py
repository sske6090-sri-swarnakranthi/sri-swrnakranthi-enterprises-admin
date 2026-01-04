import argparse, re
import pandas as pd
from pathlib import Path

def norm(s):
    s = str(s).strip().lower()
    return re.sub(r"[^a-z0-9]+", "", s)

ap = argparse.ArgumentParser()
ap.add_argument("--xlsx", required=True)
ap.add_argument("--sheet", default=0)
ap.add_argument("--out", required=True)
args = ap.parse_args()

df = pd.read_excel(args.xlsx, sheet_name=args.sheet, header=None)
header_row = None
for i in range(min(20, len(df))):
    names = [norm(x) for x in df.iloc[i].tolist()]
    if any(x in names for x in ["ean","eancode","ean13","barcode","barcodeno","barcodenumber"]):
        header_row = i
        break

if header_row is None:
    header_row = 0

cols_raw = df.iloc[header_row].tolist()
cols = []
for c in cols_raw:
    c2 = re.sub(r"\s+", " ", str(c)).strip()
    cols.append(c2)

df = df.iloc[header_row+1:].reset_index(drop=True)
df.columns = cols

keep = [c for c in df.columns if not (str(c).startswith("Unnamed") or str(c).strip()=="")]
df = df[keep]

norm_cols = {c: re.sub(r"[^a-z0-9]+","", c.lower()) for c in df.columns}
ean_candidates = [c for c in df.columns if any(k in norm_cols[c] for k in ["ean","eancode","ean13","barcode","barcodenumber","barcodeno"])]
if ean_candidates:
    df = df.rename(columns={ean_candidates[0]: "EAN"})
else:
    df["EAN"] = None

df.to_csv(args.out, index=False, encoding="utf-8")
print(f"Saved cleaned CSV: {args.out}")
print(f"Columns: {list(df.columns)}")
