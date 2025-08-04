# %%
import json
from compact_json import Formatter, EolStyle
import re

filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/medications.json"

with open(filename, "r") as f:
    data = json.load(f)

keywords = [
    "Anastrozole",
    "Atezolizumab",
    "Avastin",
    "Avelumab",
    "Bevacizumab",
    "Capecitabine",
    "Capmatinib",
    "Carboplatin",
    "Cisplatin",
    "Crizotinib",
    "Cyclophosphamide",
    "Docetaxel",
    "Dostarlimab",
    "Doxorubicin",
    "Durvalumab",
    "Enhertu",
    "Enzalutamide",
    "Epirubicin",
    "Etoposide",
    "Everolimus",
    "Exemestane",
    "Fluorouracil",
    "Fulvestrant",
    "Gemcitabine",
    "Goserelin",
    "Ifosfamide",
    "Ipilimumab",
    "Irinotecan",
    "Isatuximab",
    "Ixabepilone",
    "Letrozole",
    "Methotrexate",
    "NAB-paclitaxel",
    "Nivolumab",
    "Olaparib",
    "Oxaliplatin",
    "Paclitaxel",
    "Palbociclib",
    "Pembrolizumab",
    "Pemetrexed",
    "Petuzumab",
    "Pertuzumab Trastuzumab Hyaluronidase",
    "Rucaparib",
    "Sacituzumab Govitecan Hziy",
    "Selinexor",
    "Tamoxifen",
    "Topotecan",
    "Trametinib",
    "Trastuzumab",
    "Trastuzumab Deruxtecan Conjugate",
    "Trastuzumab Hyaluronidase Conjugate",
    "Vincristine",
    "Vinorelbine",
    "Zoledronic Acid",
]

for keyword in keywords:
    additions = [
        # "pancreas",
        "uterus"
    ]
    for entry in data:
        display = entry.get("display", "").lower()
        category = " ".join([cat.lower() for cat in entry.get("category", [])])
        pattern = re.compile(rf"\b{re.escape(keyword)}\b", flags=re.I)
        if pattern.search(display) or pattern.search(category):
            cancer_types = entry.setdefault("cancerType", [])
            for addition in additions:
                if addition not in cancer_types:
                    print("adding", addition, "to", entry["display"])
                    cancer_types.append(addition)

formatter = Formatter()
formatter.indent_spaces = 2
formatter.json_eol_style = EolStyle.LF
formatter.max_inline_length = 80
formatter.use_tab_to_indent = False
# Ensure each list element is on its own line if the list is split
formatter.max_compact_list_complexity = 0

with open(filename, "w") as f:
    serialized = formatter.serialize(data)
    # Remove trailing spaces from each line
    cleaned = "\n".join(line.rstrip() for line in serialized.splitlines())
    f.write(cleaned)
    f.write("\n")
