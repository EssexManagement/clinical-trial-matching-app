# %%[markdown]
"""
This script is used to check that concepts from the OPDE assets are contained in the trialjectory profile-system-codes,
which are used as a code-to-keyword map for generating the request to trialjectory.
> Trialjectory accepts codes not keywords.
"""

# %%
import json

opde_file = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/medications.json"
profile_codes_file = "/workspaces/acs-ctms-vol/clinical-trial-matching-service-trialjectory/data/profile-system-codes.json"

with open(opde_file, "r") as f:
    meds = json.load(f)

codes = set(
    [
        (str(entry.get("display")), str(entry.get("code")))
        for entry in meds
        if "code" in entry
    ]
)

with open(profile_codes_file, "r") as f:
    profile_codes_text = f.read()

for display, code in codes:
    if code in profile_codes_text:
        continue
    else:
        print(f'"{code}",')
