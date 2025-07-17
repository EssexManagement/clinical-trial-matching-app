# %%
import json

import pandas as pd

df_subtypes = pd.read_json(
    "optimizedPatientDataElements/cancerSubtypes.json", dtype=str
)
display(df_subtypes.head())
df_maintypes = pd.read_json("optimizedPatientDataElements/cancerTypes.json", dtype=str)
display(df_maintypes.head())

# %% [markdown]
# #### profile-system-codes for cancerTypes

# %%
cancerType = "uterus"
dd = (
    df_maintypes.loc[
        df_maintypes["cancerType"] == f"['{cancerType}']", ["code", "display"]
    ]
    .set_index(["display"])
    .to_dict()["code"]
)
for key, val in dd.items():
    dd[key] = {"SNOMED": [val]}

print(json.dumps(dd))
# %% [markdown]
# #### primary-cancer-condition-type

# %%
for key in dd:
    dd[key] = cancerType

print(json.dumps(dd))

# %% [markdown]
# #### profile-system-codes for cancerSubtypes

# %%
dd = (
    df_subtypes.loc[
        df_subtypes["cancerType"].str.contains(cancerType), ["code", "display"]
    ]
    .set_index(["display"])
    .to_dict()["code"]
)
for key, val in dd.items():
    dd[key] = {"SNOMED": [val]}

json.dumps(dd)

# %%
cancer_types_df = (
    df_maintypes.loc[
        df_maintypes["cancerType"] == f"['{cancerType}']", ["code", "display", "system"]
    ]
    .sort_values(by=["display"])
    .reset_index(drop=True)
)
cancer_types_df["fhir_concept"] = (
    "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition"
)
cancer_types_df

# %%
cancer_subtypes_df = (
    df_subtypes.loc[
        df_subtypes["cancerType"].str.contains(cancerType),
        ["code", "display", "system"],
    ]
    .sort_values(by=["display"])
    .reset_index(drop=True)
)
cancer_subtypes_df["fhir_concept"] = (
    "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior"
)
cancer_subtypes_df

# %%

pd.concat([cancer_types_df, cancer_subtypes_df], ignore_index=True).to_csv(
    f"{cancerType}_codes_carebox.csv", index=False
)

# %%
