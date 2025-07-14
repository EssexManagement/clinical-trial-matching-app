# %%
import json
import pandas as pd

opde = "metastases"
# found in ../../../clinical-trial-matching-service-carebox/src/categories.ts
filter_param = "eligibility[].fieldId = 17"
# found in ../../../clinical-trial-matching-service-carebox/src/fhir-resources.ts
value_set_id = "2.16.840.1.113883.6.96"
with open(f"../../src/assets/optimizedPatientDataElements/{opde}.json") as f:
    entries = json.load(f)

output_rows = []
for entry in entries:
    cancerType = [e.lower() for e in entry["cancerType"]]
    cancers = None
    if "pancreas" in cancerType and "uterus" in cancerType:
        cancers = "pancreas, uterus"
    elif "pancreas" in cancerType:
        cancers = "pancreas"
    elif "uterus" in cancerType:
        cancers = "uterus"
    if cancers:
        output_rows.append(
            {
                "value": entry["code"],
                "display": entry["display"],
                "filter param": filter_param,
                "value set id": value_set_id,
                "cancers": cancers,
            }
        )
    df = pd.DataFrame(output_rows)
    df.to_csv("./carebox_additional_opde_values.csv", index=False)
