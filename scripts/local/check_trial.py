# %%
nct_ids = [
    "NCT05067283",
    "NCT04300556",
    "NCT04554914",
    "NCT02408861",
    "NCT04185883",
    "NCT05712694",
    "NCT06486441",
    "NCT02715284",
    "NCT01804634",
    "NCT05907304",
    "NCT05579366",
]

# %%
import re
from datetime import timedelta

from requests_cache import CachedSession
from tqdm.notebook import tqdm

session = CachedSession(expire_after=timedelta(days=14))

studies = []
for id in tqdm(nct_ids):
    res = session.get(f"https://clinicaltrials.gov/api/v2/studies/{id}")
    res.raise_for_status()
    data = res.text
    studies.append((id, data))

# %%
import json

for id, study in studies:
    print(json.loads(study)["protocolSection"]["conditionsModule"]["conditions"])

# %%
import json
from pprint import pprint

keywordPattern = r"(uterus|uterine|endometrial|endometrium)"

matches = 0
matches = []
nonmatches = []
matchedConditions = set()
unmatchedConditions = set()
for id, study in studies:
    studyDict = json.loads(study)
    conditions = studyDict["protocolSection"]["conditionsModule"]["conditions"]
    conditionsStr = json.dumps(conditions)
    descriptionStr = studyDict["protocolSection"]["descriptionModule"][
        "detailedDescription"
        if "detailedDescription" in studyDict["protocolSection"]["descriptionModule"]
        else "briefSummary"
    ]
    if re.findall(keywordPattern, conditionsStr, re.I) or re.findall(
        keywordPattern, descriptionStr, re.I
    ):
        matches.append((id, conditionsStr))
        matchedConditions.update(conditions)
    else:
        nonmatches.append((id, conditionsStr))
        unmatchedConditions.update(conditions)

for match, conditions in matches:
    pprint([match, json.loads(conditions)], indent=2)
print(len(matches) / len(studies))
# print(sorted(matchedConditions.union(unmatchedConditions)))
print("----------------------------------------")
pprint(sorted(unmatchedConditions), indent=2)

# %%
matches, len(studies)

# %%
import json

print(
    json.dumps(
        json.loads(
            session.cache.get_response(key="8ec542ba8e7e0027").content.decode("utf-8")
        ),
        indent=1,
    )
)
# for response in session.cache.filter():
#     print(response.cache_key if 'NCT03994796' in response.url else None)
