# %%

import sqlite3
import pandas as pd

my_trials = pd.read_excel(
    "./ctsapi_cancer_us_interventional_open_and_not_yet_open.xlsx",
    engine="openpyxl",
    sheet_name="trials",
)
their_trials = pd.read_csv("./their_trials.csv", header=None)

mine = set(my_trials["nct_id"])
theirs = set(their_trials[0])

with sqlite3.connect("ctsapi_trials.sqlite") as conn:
    series = pd.Series(list(mine.difference(theirs)))
    series.name = "nct_id"
    series.to_sql("missing", conn, if_exists="replace", index=False)

# %%

# # run some queries in SQLite to further investigate
query = """
WITH maintype AS (
    SELECT missing.nct_id, group_concat(name, ';') AS maintype
    FROM missing
    LEFT JOIN diseases ON missing.nct_id = diseases.nct_id
        AND inclusion_indicator = 'TREE'
    GROUP BY missing.nct_id
),
disease_agg as (
    SELECT maintype.nct_id, maintype, group_concat(diseases.name, ';') AS lead_dise
    FROM maintype
    LEFT JOIN diseases ON maintype.nct_id = diseases.nct_id
        AND is_lead_disease = true
    GROUP BY maintype.nct_id
),
ncit_agg as (
    SELECT dagg.nct_id, dagg.maintype, dagg.lead_dise, group_concat(diseases.nci_thesaurus_concept_id, ';') AS ncit_codes
    FROM disease_agg dagg
    LEFT JOIN diseases ON dagg.nct_id = diseases.nct_id
        AND (is_lead_disease = true OR inclusion_indicator = 'TREE')
    GROUP BY dagg.nct_id
)
SELECT ncit_agg.*,
    t.current_trial_status,
    t.official_title,
    t.primary_purpose,
    t.phase,
    ct.overallStatus,
    ct.studyType
FROM ncit_agg
JOIN trials t ON ncit_agg.nct_id = t.nct_id
JOIN ctg_trials ct ON ncit_agg.nct_id = ct.nctId
"""

with sqlite3.connect("ctsapi_trials.sqlite") as conn:
    df = pd.read_sql_query(query, conn)
    df.to_excel(
        "./ctsapi_trials_missing_in_acs_can_trial_finder.xlsx",
        index=False,
        engine="xlsxwriter",
    )
