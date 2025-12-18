# %% [markdown]
"""
### Initialize libraries and functions
"""

import itertools
from collections import defaultdict
from functools import wraps

import matplotlib.pyplot as plt
import pandas as pd
from requests_cache import CachedSession as Session
from tqdm.notebook import tqdm

tqdm.pandas()


def chunker(chunk_size: int = 300):
    def decorator(func):
        @wraps(func)
        def wrapper(nct_ids: list[str], session: Session, *args, **kwargs):
            results = []
            for i in tqdm(range(0, len(nct_ids), chunk_size), desc="CTG Query Chunks"):
                chunk = nct_ids[i : i + chunk_size]
                result = func(chunk, session, *args, **kwargs)
                results.extend(result)
            return results

        return wrapper

    return decorator


@chunker(300)
def batchget_ctg_trials(nct_ids: list[str], session: Session):
    all_results = []
    print(len(nct_ids), "NCT IDs to query CTG for")
    url = f"https://clinicaltrials.gov/api/v2/studies?query.id={' OR '.join(nct_ids)}&fields=NCTId|LocationGeoPoint|LocationZip|LocationFacility|LocationCountry|LocationState|LocationCity&pageSize=1000&countTotal=true"
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


# %% [markdown]
"""
### Initialize both datasets
"""

df = pd.read_excel(
    "2025-12-08 ClinicalTrials.gov U.S. Interventional Cancer Trials (Not Closed) PS Information.xlsx",
)
aact = df[
    [
        "NCT ID",
        "PS Org",
        "PS Org City",
        "PS Org State",
        "PS Org Zip",
        "Org Latitude",
        "Org Longitude",
    ]
]
aact = aact.drop_duplicates(ignore_index=True)
print(aact.head())

with Session() as s:
    # s.cache.clear()
    # ctg_trials = df["NCT ID"].progress_apply(lambda nct_id: get_ctg_trials(nct_id, s))
    nct_ids_uniq = aact["NCT ID"].drop_duplicates().tolist()
    print(len(nct_ids_uniq), "unique NCT IDs to query")
    ctg_trials = batchget_ctg_trials(nct_ids_uniq, s)

ctg = pd.json_normalize(ctg_trials).rename(
    columns={
        "protocolSection.identificationModule.nctId": "NCT ID",
        "protocolSection.contactsLocationsModule.locations": "locations",
    }
)
locations = ctg.explode("locations").reset_index(drop=True)
locations_norm = pd.concat(
    [
        locations.drop(columns=["locations"]),
        pd.json_normalize(locations["locations"]),
    ],
    axis=1,
)
ctg = (
    locations_norm[locations_norm["country"] == "United States"]
    .reset_index(drop=True)
    .drop(columns=["country"])
)
ctg = ctg.drop_duplicates(ignore_index=True)
print(ctg.head())

# %% [markdown]
"""
### Validate lat/lon uniqueness per city/state
"""

aact_check = (
    aact.groupby(["PS Org State", "PS Org City"])[["Org Latitude", "Org Longitude"]]
    .nunique()
    .value_counts()
)
assert len(aact_check) == 2 and 0 in aact_check and 1 in aact_check, (
    "If lat/lon is defined, it should be unique per state/city"
)
print(aact_check)

ctg_check = (
    ctg.groupby(["state", "city"])[["geoPoint.lat", "geoPoint.lon"]]
    .nunique()
    .value_counts()
)
assert len(ctg_check) == 2 and 0 in ctg_check and 1 in ctg_check, (
    "If lat/lon is defined, it should be unique per state/city"
)
print(ctg_check)

# %% [markdown]
"""
### Merge datasets
"""

aact["PS Org"] = aact["PS Org"].str.lower().str.strip()
ctg["facility"] = ctg["facility"].str.lower().str.strip()
how = "left"
merged = pd.merge(
    aact,
    ctg,
    left_on=["NCT ID", "PS Org", "PS Org State", "PS Org City", "PS Org Zip"],
    right_on=["NCT ID", "facility", "state", "city", "zip"],
    how=how,
)
assert len(merged) == len(aact if how == "left" else ctg), (
    "Merge should match change number of left's rows"
)

# %% [markdown]
"""
### Check matching lat/lon values
"""


def check_latlon(row: pd.Series) -> bool:
    aact_lat = row["Org Latitude"]
    aact_lon = row["Org Longitude"]
    ctg_lat = row["geoPoint.lat"]
    ctg_lon = row["geoPoint.lon"]

    def compare(v1, v2):
        if pd.isna(v1) and pd.isna(v2):
            return True
        if pd.isna(v1) or pd.isna(v2):
            return False
        return abs(float(v1) - float(v2)) < 1e-5

    if compare(aact_lat, ctg_lat) and compare(aact_lon, ctg_lon):
        return True
    return False


checked_merged = merged.progress_apply(check_latlon, axis=1)
print(checked_merged.value_counts())

# %%

glob_tmp = None
glob_row = None
glob_filename = None

aggregates = defaultdict(list)
stats = defaultdict(int)


def check_row(row: pd.Series) -> pd.Series:
    global glob_tmp, glob_row, glob_filename
    glob_filename = "mismatches.xlsx"
    nct_id = row["NCT ID"]
    org = row["PS Org"]
    city = row["PS Org City"]
    state = row["PS Org State"]
    zip_ = row["PS Org Zip"]
    res = ctg[ctg["NCT ID"] == nct_id]
    checks = [
        ("facility", org),
        ("city", city),
        ("state", state),
        ("zip", zip_),
    ]
    key_map = {
        "facility": "PS Org",
        "city": "PS Org City",
        "state": "PS Org State",
        "zip": "PS Org Zip",
    }

    valid_checks = [(k, v) for k, v in checks if pd.notna(v)]

    for r in range(len(valid_checks), 0, -1):
        for combo in itertools.combinations(valid_checks, r):
            temp_res = res
            for col, val in combo:
                temp_res = temp_res[temp_res[col] == val]

            if not temp_res.empty:
                row_aact = row.to_frame().T.loc[:, :"Org Longitude"]
                glob_tmp, glob_row = temp_res, row_aact
                if ("city", city) in combo and ("state", state) in combo:
                    check_this_series = pd.Series(
                        {
                            "Org Latitude": row["Org Latitude"],
                            "Org Longitude": row["Org Longitude"],
                            "geoPoint.lat": temp_res["geoPoint.lat"]
                            .drop_duplicates()
                            .item(),
                            "geoPoint.lon": temp_res["geoPoint.lon"]
                            .drop_duplicates()
                            .item(),
                        }
                    )
                    assert check_latlon(check_this_series), (
                        "Lat/Lon should match for city/state matches"
                    )
                missing_checks = sorted(
                    [check[0] for check in valid_checks if check not in combo]
                )
                matching_checks = sorted([check[0] for check in combo])
                key = "_".join(missing_checks)
                merged = pd.merge(
                    row_aact,
                    temp_res,
                    how="left",
                    left_on=[key_map[c] for c in matching_checks],
                    right_on=matching_checks,
                    suffixes=("", "_y"),
                )
                merged = merged.drop(
                    columns=[col for col in merged.columns if col.endswith("_y")]
                )
                aggregates[f"invalid_{key}"].append(merged)
                stats[f"invalid_{key}"] += 1
                return True
    aggregates["invalid_everything"].append(row.to_frame().T)
    stats["invalid_everything"] += 1
    return False


def check_row_inverse(row: pd.Series) -> bool:
    global glob_tmp, glob_row, glob_filename
    glob_filename = "mismatches (1).xlsx"
    nct_id = row["NCT ID"]
    facility = row["facility"]
    city = row["city"]
    state = row["state"]
    zip_ = row["zip"]
    res = aact[aact["NCT ID"] == nct_id]
    checks = [
        ("PS Org", facility),
        ("PS Org City", city),
        ("PS Org State", state),
        ("PS Org Zip", zip_),
    ]
    key_map = {
        "PS Org": "facility",
        "PS Org City": "city",
        "PS Org State": "state",
        "PS Org Zip": "zip",
    }

    valid_checks = [(k, v) for k, v in checks if pd.notna(v)]

    for r in range(len(valid_checks), 0, -1):
        for combo in itertools.combinations(valid_checks, r):
            temp_res = res
            for col, val in combo:
                temp_res = temp_res[temp_res[col] == val]

            if not temp_res.empty:
                ctg_cols = [
                    "NCT ID",
                    "facility",
                    "state",
                    "city",
                    "zip",
                    "geoPoint.lat",
                    "geoPoint.lon",
                ]
                cols_to_select = [c for c in ctg_cols if c in row.index]
                row_ctg = row[cols_to_select].to_frame().T
                glob_tmp, glob_row = temp_res, row_ctg
                if ("PS Org City", city) in combo and ("PS Org State", state) in combo:
                    check_this_series = pd.Series(
                        {
                            "Org Latitude": temp_res["Org Latitude"]
                            .drop_duplicates()
                            .item(),
                            "Org Longitude": temp_res["Org Longitude"]
                            .drop_duplicates()
                            .item(),
                            "geoPoint.lat": row["geoPoint.lat"],
                            "geoPoint.lon": row["geoPoint.lon"],
                        }
                    )
                    assert check_latlon(check_this_series), (
                        "Lat/Lon should match for city/state matches"
                    )
                missing_checks = sorted(
                    [check[0] for check in valid_checks if check not in combo]
                )
                matching_checks = sorted([check[0] for check in combo])
                key = "_".join(key_map[key] for key in missing_checks)
                merged = pd.merge(
                    row_ctg,
                    temp_res,
                    how="left",
                    left_on=[key_map[c] for c in matching_checks],
                    right_on=matching_checks,
                    suffixes=("", "_y"),
                )
                merged = merged.drop(
                    columns=[col for col in merged.columns if col.endswith("_y")]
                )
                aggregates[f"invalid_{key}"].append(merged)
                stats[f"invalid_{key}"] += 1
                return True
    aggregates["invalid_everything"].append(row.to_frame().T)
    stats["invalid_everything"] += 1
    return False


print(
    merged[~checked_merged]
    .reset_index(drop=True)
    .progress_apply(check_row, axis=1)
    .value_counts()
)

labels = {
    "invalid_city_facility_zip": "Matching State",
    "invalid_facility_zip": "Matching City/State",
    "invalid_city": "Matching State/Facility/Zip",
    "invalid_zip": "Matching City/State/Facility",
    "invalid_city_state_zip": "Matching Facility",
    "invalid_city_zip": "Matching State/Facility",
    "invalid_facility": "Matching City/State/Zip",
    "invalid_everything": "Nothing Matches",
}
if stats:
    stats_series = pd.Series(stats).sort_values(ascending=True)
    stats_series.index = stats_series.index.map(
        lambda x: f"{labels[x]}\n({x})" if x in labels else x
    )
    print(stats_series)

    plt.figure(figsize=(12, 8))
    ax = stats_series.plot(kind="barh")
    plt.title(f"Distribution of Mismatch Scenarios (n={stats_series.sum()})")
    plt.xlabel("Count")

    for container in ax.containers:
        ax.bar_label(container)

    plt.tight_layout()
    plt.show()

# %%

glob_filename = "tmp.xlsx"
with pd.ExcelWriter(glob_filename, engine="xlsxwriter") as writer:
    for key, val in aggregates.items():
        if val:
            pd.concat(val, ignore_index=True).to_excel(
                writer, sheet_name=key[:31], index=False
            )
print(f"Saved mismatches to {glob_filename}")

# %% [markdown]
"""
### Investigate missing lat/lon per city/state
"""

print("--- AACT Missing Geo ---")
aact_citystate_missing_geo = aact[
    (aact["Org Latitude"].isna() | aact["Org Longitude"].isna())
][["PS Org State", "PS Org City"]].drop_duplicates(ignore_index=True)
print(aact_citystate_missing_geo)
set_aact_missing = set(
    tuple(x)
    for x in aact_citystate_missing_geo[["PS Org State", "PS Org City"]].to_numpy()
)

print("--- CTG Missing Geo ---")
ctg_citystate_missing_geo = ctg[
    (ctg["geoPoint.lat"].isna() | ctg["geoPoint.lon"].isna())
][["state", "city"]].drop_duplicates(ignore_index=True)
print(ctg_citystate_missing_geo)
set_ctg_missing = set(
    tuple(x) for x in ctg_citystate_missing_geo[["state", "city"]].to_numpy()
)

print("--- AACT Difference ---")
print(set_aact_missing - set_ctg_missing)

print("--- CTG Difference ---")
print(set_ctg_missing - set_aact_missing)

print("\n\n--- AACT Filling ---")
for state, city in set_aact_missing:
    print("--- Processing State:", state, "City:", city, "---")
    records = (
        aact[(aact["PS Org State"] == state) & (aact["PS Org City"] == city)][
            ["Org Latitude", "Org Longitude"]
        ]
        .drop_duplicates()
        .dropna(how="all")
    )
    if not records.empty:
        print(f"--- Filling for State: {state}, City: {city} ---")
        aact_citystate_missing_geo = aact_citystate_missing_geo.merge(
            records,
            on=["PS Org State", "PS Org City"],
            how="left",
        )

print("\n\n--- CTG Filling ---")
for state, city in set_ctg_missing:
    print("--- Processing State:", state, "City:", city, "---")
    records = (
        ctg[(ctg["state"] == state) & (ctg["city"] == city)][
            ["geoPoint.lat", "geoPoint.lon"]
        ]
        .drop_duplicates()
        .dropna(how="all")
    )
    if not records.empty:
        print(f"--- Filling for State: {state}, City: {city} ---")
        ctg_citystate_missing_geo = ctg_citystate_missing_geo.merge(
            records,
            on=["state", "city"],
            how="left",
        )
