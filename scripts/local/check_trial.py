# %%
nct_ids = [
    "NCT05538663",
    "NCT04452591",
    "NCT06111235",
    "NCT06211764",
    "NCT06319820",
    "NCT06567743",
    "NCT03435796",
    "NCT03899155",
    "NCT04365374",
    "NCT06225596",
    "NCT03785249",
    "NCT02138734",
    "NCT02693535",
    "NCT02715284",
    "NCT05768139",
    "NCT06848348",
    "NCT03486873",
    "NCT05226507",
    "NCT03550391",
    "NCT04262466",
    "NCT04879329",
    "NCT05006794",
    "NCT05377996",
    "NCT06036121",
    "NCT05973487",
    "NCT06227377",
    "NCT06253871",
    "NCT03589339",
    "NCT05538130",
    "NCT02817633",
    "NCT03093116",
    "NCT04963153",
    "NCT05726864",
    "NCT05316155",
    "NCT03175224",
    "NCT06695845",
    "NCT04185883",
    "NCT04787042",
    "NCT04913285",
    "NCT03547973",
    "NCT04064359",
    "NCT04799054",
    "NCT04626635",
    "NCT02408861",
    "NCT05736731",
    "NCT05907304",
    "NCT06191796",
    "NCT06297525",
    "NCT05379985",
    "NCT06040541",
    "NCT05479812",
    "NCT05067283",
    "NCT05660421",
    "NCT04429542",
    "NCT03947385",
    "NCT04503265",
    "NCT06108479",
    "NCT06777316",
    "NCT04465487",
    "NCT01804634",
    "NCT05267587",
    "NCT06476548",
    "NCT05768347",
    "NCT06253845",
    "NCT06560398",
    "NCT06909357",
    "NCT06926972",
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
    data = res.json()
    studies.append((id, data))


# %%
import json
from pprint import pprint

keywordPattern = r"(bladder|urothelial)"
# keywordPattern = r"(uterus|uterine|endometrial|endometrium)"
# keywordPattern = r"(sarcoma)"

matches = 0
matches = []
nonmatches = []
matchedConditions = set()
unmatchedConditions = set()
for id, study in studies:
    conditions = study["protocolSection"]["conditionsModule"]["conditions"]
    conditionsStr = json.dumps(conditions)
    searchStr = (
        conditionsStr + study["protocolSection"]["identificationModule"]["briefTitle"]
    )
    if re.findall(keywordPattern, searchStr, re.I):
        matches.append(id)
        matchedConditions.update(conditions)
    else:
        nonmatches.append(id)
        unmatchedConditions.update(conditions)

# for match, conditions in matches:
#     pprint([match, json.loads(conditions)], indent=2)
print(len(matches), len(matches) / len(studies), len(studies))
print(matches)
# print(sorted(matchedConditions.union(unmatchedConditions)))
# print("----------------------------------------")
# pprint(sorted(unmatchedConditions), indent=2)

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
