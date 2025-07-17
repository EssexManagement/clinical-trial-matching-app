# %% imports
import io
import json

import pandas as pd

# %% Copy/paste the table of Concept, Preferred Term, and ID from SNOMED CT Browser ECL builder results
filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/cancerTypes.json"
cancerType = [["uterus"]]
entryType = "cancerType"
# --------------
# filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/cancerSubtypes.json"
# cancerType = [["pancreas"]]
# entryType = "cancerType"
# --------------
# filename = "/workspaces/acs-ctms-vol/clinical-trial-matching-app/src/assets/optimizedPatientDataElements/cancerSubtypes.json"
# cancerType = [["pancreas"]]
# entryType = "cancerSubtype"
# --------------
new_data = """
Adenocarcinoma of endometrium (disorder)	Adenocarcinoma of endometrium	123845008
Adenosarcoma of corpus uteri (disorder)	Adenosarcoma of corpus uteri	765740002
Carcinofibroma of corpus uteri (disorder)	Carcinofibroma of corpus uteri	778066006
Carcinosarcoma of corpus uteri (disorder)	Carcinosarcoma of corpus uteri	764952009
Carcinosarcoma of endometrium (disorder)	Endometrial carcinosarcoma	732201008
Endometrial carcinoma (disorder)	Endometrial carcinoma	254878006
Endometrioid carcinoma of endometrium (disorder)	Endometrioid carcinoma of endometrium	1260086007
High grade endometrial stromal sarcoma (disorder)	High grade endometrial stromal sarcoma	699358009
High-grade neuroendocrine carcinoma of corpus uteri (disorder)	High-grade neuroendocrine carcinoma of corpus uteri	773774000
Leiomyosarcoma of corpus uteri (disorder)	Leiomyosarcoma of corpus uteri	770559003
Low grade endometrial stromal sarcoma (disorder)	Low grade endometrial stromal sarcoma	699357004
Malignant epithelial neoplasm of body of uterus (disorder)	Carcinoma of corpus uteri	449073009
Malignant epithelial neoplasm of fundus of uterus (disorder)	Carcinoma of fundus of uterus	449054005
Malignant germ cell neoplasm of corpus uteri (disorder)	Malignant germ cell neoplasm of corpus uteri	773284000
Malignant neoplasm of cornu of corpus uteri (disorder)	Malignant neoplasm of cornu of corpus uteri	188190005
Malignant neoplasm of corpus uteri, excluding isthmus (disorder)	Malignant neoplasm of corpus uteri, excluding isthmus	188189001
Malignant neoplasm of endometrium of corpus uteri (disorder)	Malignant neoplasm of endometrium of corpus uteri	188192002
Malignant neoplasm of fundus of corpus uteri (disorder)	Malignant neoplasm of fundus of corpus uteri	188191009
Malignant neoplasm of isthmus of uterine body (disorder)	Malignant neoplasm of isthmus of uterine body	188195000
Malignant neoplasm of myometrium of corpus uteri (disorder)	Malignant neoplasm of myometrium of corpus uteri	188193007
Overlapping malignant neoplasm of body of uterus (disorder)	Overlapping malignant neoplasm of body of uterus	109879008
Peripheral neuroectodermal neoplasm of corpus uteri (disorder)	Peripheral neuroectodermal neoplasm of corpus uteri	1156804004
Primary adenosquamous carcinoma of endometrium (disorder)	Primary adenosquamous carcinoma of endometrium	107791000119107
Primary malignant clear cell neoplasm of endometrium (disorder)	Primary malignant clear cell neoplasm of endometrium	107771000119106
Primary malignant stromal sarcoma of endometrium (disorder)	Primary malignant stromal sarcoma of endometrium	1260116000
Primary mixed adenocarcinoma of endometrium (disorder)	Primary mixed adenocarcinoma of endometrium	722681008
Primary mucinous adenocarcinoma of endometrium (disorder)	Primary mucinous adenocarcinoma of endometrium	722679006
Primary papillary carcinoma of body of uterus (disorder)	Primary papillary carcinoma of body of uterus	1197266009
Primary poorly differentiated endocrine carcinoma of body of uterus (disorder)	Primary poorly differentiated endocrine carcinoma of corpus uteri	1197260003
Primary rhabdomyosarcoma of fundus uteri (disorder)	Rhabdomyosarcoma of fundus uteri	1162286009
Primary rhabdomyosarcoma of isthmus of uterine body (disorder)	Rhabdomyosarcoma of isthmus uteri	1162280003
Primary serous adenocarcinoma of endometrium (disorder)	Primary serous adenocarcinoma of endometrium	722680009
Primary small cell carcinoma of endometrium (disorder)	Primary small cell neuroendocrine carcinoma of endometrium	722682001
Primary squamous cell carcinoma of endometrium (disorder)	Primary squamous cell carcinoma of endometrium	733359005
Primitive neuroectodermal tumor of corpus uteri (disorder)	Primitive neuroectodermal tumour of corpus uteri	766247009
Rhabdomyosarcoma of corpus uteri (disorder)	Rhabdomyosarcoma of corpus uteri	763409006
Rhabdomyosarcoma of endometrium of corpus uteri (disorder)	Rhabdomyosarcoma of endometrium of corpus uteri	1255385002
Rhabdomyosarcoma of myometrium of corpus uteri (disorder)	Rhabdomyosarcoma of myometrium of corpus uteri	1255628005
Sarcoma of body of uterus (disorder)	Sarcoma of corpus uteri	1162311007
Sarcoma of endometrium (disorder)	Sarcoma of endometrium	447266004
Serous carcinoma of body of uterus (disorder)	Serous carcinoma of body of uterus	1230318000
Squamous cell carcinoma of corpus uteri (disorder)	Squamous cell carcinoma of corpus uteri	764737005
Transitional cell carcinoma of corpus uteri (disorder)	Transitional cell carcinoma of corpus uteri	785807007
Undifferentiated carcinoma of corpus uteri (disorder)	Undifferentiated carcinoma of corpus uteri	766758001
Undifferentiated carcinoma of endometrium (disorder)	Undifferentiated carcinoma of endometrium	1255394008
Well-differentiated neuroendocrine tumor of corpus uteri (disorder)	Well-differentiated neuroendocrine tumor of corpus uteri	1288024001
"""
category = [["Uterus"]]
# category = [["Large Cell Neuroendocrine"]]


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
