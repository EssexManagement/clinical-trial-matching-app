# %% imports
import io
import json

import pandas as pd

# %% Copy/paste the table of Concept, Preferred Term, and ID from SNOMED CT Browser ECL builder results
# filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/cancerTypes.json"
# cancerType = [["pancreas"]]
# entryType = "cancerType"
# --------------
filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/cancerSubtypes.json"
cancerType = [["pancreas"]]
entryType = "cancerSubtype"
# --------------
new_data = """
Large cell neuroendocrine carcinoma (morphologic abnormality)\t_\t128628002
"""
# category = [["Pancreas"]]
category = [["Large Cell Neuroendocrine"]]


def do_standardization(
    df: pd.DataFrame, cancerType: list[list[str]], category: list[list[str]]
):
    assert isinstance(cancerType, list)
    df["entryType"] = entryType
    df["cancerType"] = cancerType * len(df)
    df["system"] = "http://snomed.info/sct"
    df["category"] = category * len(df) if len(category) < len(df) else category


new_frame = pd.read_csv(
    io.StringIO(new_data),
    sep="\t",
    header=None,
    names=["display", "_", "code"],
    dtype=str,
)
new_frame = new_frame.drop(labels=["_"], axis=1)
display(new_frame.head())

old_frame = pd.read_json(
    filename,
    dtype={
        "code": str,
        "display": str,
        "system": str,
        "category": object,
        "entryType": str,
        "cancerType": object,
    },
)
display(old_frame.tail())

do_standardization(new_frame, cancerType, category)
display(new_frame.head())

# %% DF to List[dict]

combined_frame = pd.concat([old_frame, new_frame]).reset_index(drop=True)

print(combined_frame.duplicated(subset=["code", "system"]).sum(), "dupes")
combined_frame = combined_frame.drop_duplicates(
    subset=["code", "system"], ignore_index=True
)
display(combined_frame.tail())

with open(filename, "w") as fp:
    records = combined_frame.to_dict(orient="records")
    json.dump(records, fp, indent=2)
