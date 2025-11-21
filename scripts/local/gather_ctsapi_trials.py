# %%
import datetime
import os
import sqlite3

import pandas as pd
from requests_cache import CachedSession
from tqdm.notebook import tqdm

tqdm.pandas()

key = os.getenv("CTS_V2_API_KEY")

DEBUG = False

"""
SEARCH CRITERIA:
Cancer, Interventional, US Location, Not Yet Open & Open (Recruiting, Enrolling by Invitation)
"""

TRIAL_STATUSES = [
    "In Review",
    "Approved",
    "Active",
    "Enrolling by Invitation",
]
SITE_STATUSES = [
    "in_review",
    "approved",
    "active",
    "enrolling_by_invitation",
]
SITE_STATUSES_UPPER = [status.upper() for status in SITE_STATUSES]
BASE_CRITERIA = {
    "sites.org_country": "United States",
    "sites.recruitment_status": SITE_STATUSES,
    "study_protocol_type": "Interventional",
    "current_trial_status": TRIAL_STATUSES,
}


def get_maintypes(session: CachedSession):
    url = "https://clinicaltrialsapi.cancer.gov/api/v2/diseases"
    headers = {"X-API-KEY": key}
    response = session.get(
        url,
        headers=headers,
        params={
            **BASE_CRITERIA,
            "type": "maintype",
        },
    )
    response.raise_for_status()
    jdata = response.json()
    return pd.json_normalize(
        jdata["data"],
    )


def get_trials(session: CachedSession, start: int, **criteria):
    data = {
        "from": start,
        **criteria,
    }
    res = session.post(
        "https://clinicaltrialsapi.cancer.gov/api/v2/trials",
        json=data,
        headers={"X-API-KEY": key},
    )
    res.raise_for_status()
    return res.json()


def gather_trials(session: CachedSession, **criteria):
    page = get_trials(session=session, start=0, **criteria)
    total = page["total"]
    trials = page["data"]
    if DEBUG:
        return trials
    pbar = tqdm(total=total)
    pbar.update(len(trials))
    while len(trials) < total:
        next_page = get_trials(session=session, start=len(trials), **criteria)
        trials.extend(next_page["data"])
        pbar.update(len(next_page["data"]))
    pbar.refresh()
    return trials


def chunker(func, chunk_size: int = 300):
    def wrapper(nct_ids: list[str], session: CachedSession):
        results = []
        for i in tqdm(range(0, len(nct_ids), chunk_size), desc="CTG Query Chunks"):
            chunk = nct_ids[i : i + chunk_size]
            result = func(chunk, session)
            results.extend(result)
        return results

    return wrapper


@chunker
def get_ctg_trials(nct_ids: list[str], session: CachedSession) -> pd.DataFrame:
    all_results = []
    print(len(nct_ids), "NCT IDs to query CTG for")
    url = f"https://clinicaltrials.gov/api/v2/studies?query.id={' OR '.join(nct_ids)}&fields=OverallStatus|StudyType|NCTId&pageSize=1000&countTotal=true"
    response = session.get(url)
    response.raise_for_status()
    jdata = response.json()
    all_results.extend(jdata["studies"])
    pages = 1
    print(jdata["totalCount"], "Results expected")
    assert jdata["totalCount"] == len(nct_ids), (
        "Number of NCT IDs does not match API's returned count"
    )
    while jdata.get("nextPageToken"):
        print(pages)
        response = session.get(f"{url}&pageToken={jdata['nextPageToken']}")
        response.raise_for_status()
        jdata = response.json()
        all_results.extend(jdata["studies"])
        pages += 1
    assert len(all_results) == jdata["totalCount"], (
        "Did not retrieve all expected results"
    )
    return all_results


DB_PATH = "ctsapi_trials.sqlite"
with CachedSession(
    expire_after=datetime.timedelta(days=1), allowable_methods=["GET", "POST"]
) as session:
    # session.cache.clear()
    maintypes = get_maintypes(session)
    all_trials = []
    for idx, codes in enumerate(tqdm(maintypes["codes"], desc="Maintypes")):
        maintype_trials = gather_trials(
            session=session,
            **{
                **BASE_CRITERIA,
                "size": 50 if not DEBUG else 1,
                "maintype": codes,
                "include": [
                    "nct_id",
                    "current_trial_status",
                    "official_title",
                    "primary_purpose",
                    "phase",
                    "diseases.is_lead_disease",
                    "diseases.name",
                    "diseases.inclusion_indicator",
                    "diseases.nci_thesaurus_concept_id",
                    "sites.org_city",
                    "sites.org_coordinates",
                    "sites.org_country",
                    "sites.org_name",
                    "sites.org_postal_code",
                    "sites.org_state_or_province",
                    "sites.recruitment_status",
                ],
            },
        )
        all_trials.extend(maintype_trials)
        if DEBUG:
            break

    df = pd.json_normalize(all_trials)
    print(f"Total trials gathered: {len(df)}")
    ids = df[
        ["nct_id", "current_trial_status", "official_title", "primary_purpose", "phase"]
    ].drop_duplicates(ignore_index=True)
    print(f"Total trials after dropping dupes: {len(ids)}")
    diseases = df.explode("diseases", ignore_index=True).drop(
        columns=["sites", "current_trial_status"]
    )
    print(f"Total disease entries after explode: {len(diseases)}")
    sites = df.explode("sites", ignore_index=True).drop(
        columns=["diseases", "current_trial_status"]
    )
    print(f"Total sites entries after explode: {len(sites)}")

    diseases = pd.concat(
        [
            diseases.drop(columns=["diseases"]),
            pd.json_normalize(diseases["diseases"]),
        ],
        axis=1,
    ).drop_duplicates(ignore_index=True)
    print(
        f"Total disease entries after normalizing and dropping dupes: {len(diseases)}"
    )
    sites = pd.concat(
        [sites.drop(columns=["sites"]), pd.json_normalize(sites["sites"])],
        axis=1,
    ).drop_duplicates(ignore_index=True)
    print(f"Total site entries after normalizing and dropping dupes: {len(sites)}")

    all_maintypes = maintypes["codes"].explode().to_list()
    diseases = diseases[
        (diseases["inclusion_indicator"] == "TRIAL")
        | diseases["nci_thesaurus_concept_id"].isin(all_maintypes)
    ].reset_index(drop=True)
    print(
        f"Total disease entries after filtering to trial-level and matching maintype codes: {len(diseases)}"
    )

    sites = sites[
        (sites["org_country"] == "United States")
        & sites["recruitment_status"].isin(SITE_STATUSES_UPPER)
    ].reset_index(drop=True)
    sites = sites.dropna(how="all", axis=1)
    print(
        f"Total site entries after filtering to US and valid recruitment statuses: {len(sites)}"
    )

    print(f"Querying CTG for {len(ids['nct_id'])} trial statuses...")
    ctg_ids = get_ctg_trials(ids["nct_id"].to_list(), session=session)
    ctg_df = pd.json_normalize(ctg_ids)
    ctg_df.columns = [col.split(".")[-1] for col in ctg_df.columns]
    print(f"Total CTG trial entries retrieved: {len(ctg_df)}")

    with sqlite3.connect(DB_PATH) as conn:
        ids.to_sql("trials", conn, if_exists="replace", index=False)
        diseases.to_sql("diseases", conn, if_exists="replace", index=False)
        sites.to_sql("sites", conn, if_exists="replace", index=False)
        ctg_df.to_sql("ctg_trials", conn, if_exists="replace", index=False)

# %%

with sqlite3.connect(DB_PATH) as conn:
    ids = pd.read_sql("SELECT * FROM trials", conn)
    diseases = pd.read_sql("SELECT * FROM diseases", conn)
    sites = pd.read_sql("SELECT * FROM sites", conn)
    ctg_ids = pd.read_sql("SELECT * FROM ctg_trials", conn)
    ids_merged = ids.merge(
        ctg_ids,
        how="inner",
        left_on="nct_id",
        right_on="nctId",
    )
    assert len(ids) == len(ids_merged), "Mismatch between CTSAPI and CTG trial counts"
    print("Len IDs pre filter from CTG status and study type:", len(ids_merged))
    ids_merged = ids_merged[
        ids_merged["overallStatus"].isin(
            ["RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION"]
        )
        & (ids_merged["studyType"] == "INTERVENTIONAL")
    ].reset_index(drop=True)
    print("Len IDs post filter from CTG status and study type:", len(ids_merged))
    with pd.ExcelWriter(
        "ctsapi_cancer_us_interventional_open_and_not_yet_open.xlsx",
        engine="xlsxwriter",
    ) as writer:
        details = pd.json_normalize(
            {
                "Queried On": datetime.datetime.now(tz=datetime.timezone.utc).strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
                **BASE_CRITERIA,
                "CTS API Removal Process": "Tree-level diseases except for those that matched the maintype search; sites outside of United States or sites with statuses not in the sites.recruitment_status list",
                "CTG API Removal Process": "After merging CTSAPI and CTG trials on NCT ID, removed trials whose CTG overallStatus was not in ['RECRUITING', 'NOT_YET_RECRUITING', 'ENROLLING_BY_INVITATION'] and studyType was not 'INTERVENTIONAL'",
                "count of trials before CTG API removal process": len(ids),
                "count of trials after CTG API removal process": len(ids_merged),
            }
        ).transpose()
        details.to_excel(writer, sheet_name="details")
        ids_merged.to_excel(writer, sheet_name="trials", index=False)
        diseases.to_excel(writer, sheet_name="diseases", index=False)
        sites.to_excel(writer, sheet_name="sites", index=False)
