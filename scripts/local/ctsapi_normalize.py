# %%
import json
import pandas as pd
from tqdm.notebook import tqdm

tqdm.pandas()

og = pd.read_csv("scripts/local/ctsapi_int_nyr_r_ebi_20251222.csv")
og.head()

# %%

for col in og.select_dtypes(include=["object"]).columns:
    if og[col].str.startswith("[").any() or og[col].str.startswith("{").any():
        print(col)

listed_cols = [
    "other_ids",
    "keywords",
    "sites",
    "collaborators",
    "associated_studies",
    "outcome_measures",
    "biomarkers",
    "diseases",
    "arms",
    "status_history",
    "prior_therapy",
    "nci_programs",
    "anatomic_sites",
    "eligibility.unstructured",
]


def try_parse_json(x: str):
    if isinstance(x, (list, dict)) or pd.isna(x):
        return x
    try:
        return json.loads(x)
    except json.JSONDecodeError:
        try:
            return eval(x)
        except:
            pass
    return x


for col in listed_cols:
    print("parsing column:", col)
    try:
        og[col] = og[col].progress_apply(try_parse_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing column {col}: {e}")

# %%

df = og.copy()
output_file = "ctsapi_int_nyr_r_ebi_20251222_norm.xlsx"

with pd.ExcelWriter(output_file, engine="xlsxwriter") as writer:
    for col in listed_cols:
        print(f"Exploding and normalizing column: {col}")
        exploded_df = df.explode(col, ignore_index=True)
        normalized_df = pd.json_normalize(exploded_df[col])
        if normalized_df.empty:
            normalized_df = exploded_df[[col]].copy()
        normalized_df = pd.concat([exploded_df["nct_id"], normalized_df], axis=1)
        normalized_df = normalized_df.dropna(
            how="all", subset=normalized_df.columns.difference(["nct_id"])
        ).reset_index(drop=True)

        if "interventions" in normalized_df.columns:
            print(f"  Further normalizing 'interventions' within {col}")
            exploded_df = normalized_df.explode("interventions", ignore_index=True)
            normalized_df = pd.json_normalize(exploded_df["interventions"])
            normalized_df = pd.concat(
                [
                    exploded_df[["nct_id", "name", "description", "type"]],
                    normalized_df,
                ],
                axis=1,
            )
            normalized_df = normalized_df.dropna(
                how="all",
                subset=normalized_df.columns.difference(
                    ["nct_id", "name", "description", "type"]
                ),
            ).reset_index(drop=True)

        sheet_name = col.replace(".", "_")[:31]  # Excel sheet name limit
        normalized_df.to_excel(writer, sheet_name=sheet_name, index=False)
        print(normalized_df.info())
        print(f"Saved {len(normalized_df)} rows to sheet '{sheet_name}'")

        df = df.drop(columns=[col])

    df.to_excel(writer, sheet_name="main", index=False)
    print(f"Saved main dataframe with {len(df)} rows")

print(f"Excel file saved to {output_file}")
