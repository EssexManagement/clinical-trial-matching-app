# %% list all opde files
import glob
import json
from pathlib import Path

import pandas as pd

# %%

opde_files = glob.glob(
    "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/*.json"
)
opde_to_coding_syst: dict[str, set] = {}
opde_to_categories: dict[str, set] = {}
opde_to_categories_to_dn: dict[str, dict[tuple[str], set[tuple]]] = {}
opde_to_cancertype_to_cat: dict[str, dict[tuple[str], set]] = {}
code_to_dn: dict[str, str] = {}

for file in opde_files:
    with open(file) as fp:
        data = json.load(fp)
    basename = Path(file).name.replace(".json", "")
    if not isinstance(data, list):
        print("unexpected data type", type(data), basename)
        continue
    if "system" not in data[0]:
        print("not a coding system entry", data[0], basename)
        continue
    for entry in data:
        if basename not in opde_to_coding_syst:
            opde_to_coding_syst[basename] = set()
            opde_to_categories[basename] = set()
            cat_to_dn = opde_to_categories_to_dn[basename] = {}
            cancertype_to_cat = opde_to_cancertype_to_cat[basename] = {}
        if entry["code"] not in code_to_dn:
            code_to_dn[entry["code"]] = entry["display"]
        if entry.get("category"):
            key = tuple(entry["category"])
            if key not in cat_to_dn:
                cat_to_dn[key] = set()
            cat_to_dn[key].add((entry.get("display"), entry["code"]))
        if entry.get("category") and entry.get("cancerType"):
            key = tuple(entry["cancerType"])
            if key not in cancertype_to_cat:
                cancertype_to_cat[key] = set()
            cancertype_to_cat[key].update(entry["category"])
        opde_to_coding_syst[basename].add(entry["system"])
        opde_to_categories[basename].update(entry.get("category", []))
    print()

# %% Save the OPDE to coding system mapping

max_len = max((len(val) for val in opde_to_coding_syst.values()))
opde_to_coding_syst_cp = {key: list(val) for key, val in opde_to_coding_syst.items()}
for key, val in opde_to_coding_syst_cp.items():
    while len(val) < max_len:
        val.append(pd.NA)

pd.DataFrame(opde_to_coding_syst_cp).transpose().to_csv("OPDE to Coding Systems.csv")


# %% Print the values of a particular OPDE type

for cat in sorted(opde_to_categories["cancerTypes"]):
    print(cat)

# %% Get category to display name of Bladder cancer
df = (
    pd.DataFrame(
        opde_to_categories_to_dn["cancerTypes"][("Bladder",)],
        columns=["Display", "Code"],
    )
    .sort_values(by=["Display"])
    .reset_index(drop=True)
)
df.to_csv("bladder_cancer_type.csv", index=False, encoding="utf_8_sig")
df

# %% Get cancerType to category for cancerSubtype

opde_to_cancertype_to_cat["cancerSubtypes"][("bladder",)]

# %% Gap analysis

df = pd.read_excel(
    "/workspaces/acs-ctms-vol/TGH Cancer Type SNOMED codes - Pancreatic and Uterine.xlsx",
    sheet_name="Pancreas",
    dtype=str,
)
df_codes = pd.DataFrame.from_dict(code_to_dn, orient="index", columns=["Display"])
df_codes
codes_aligned = pd.merge(
    df, df_codes, how="left", left_on="SNOMED Code", right_index=True
)
codes_aligned
