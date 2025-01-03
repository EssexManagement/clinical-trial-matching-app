// NOTE: Uncomment this out for facilities information
//import { getContact } from '@/components/Results/utils';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { FullSearchParameters } from 'types/search-types';
import { v4 as uuidv4 } from 'uuid';
import { ContactProps, StudyDetail, StudyDetailProps } from '../components/Results/types';

// NOTE: Uncomment this out for facilities information
// const SiteRowKeys = {
//   facility: 'Facility',
//   phone: 'Phone',
//   email: 'Email',
// };

export const MainRowKeys = {
  trialId: 'Trial Id',
  source: 'Source',
  likelihood: 'Match Likelihood',
  title: 'Title',
  status: 'Overall Status',
  period: 'Period',
  phase: 'Trial Phase',
  conditions: 'Conditions',
  type: 'Study Type',
  description: 'Description',
  eligibility: 'Eligibility',
  sponsor: 'Sponsor',
  contactName: 'Overall Contact',
  contactPhone: 'Overall Contact Phone',
  contactEmail: 'Overall Contact Email',
};

// Translates redcaps
export const RedCapHeaders = [
  'record_id',
  'redcap_event_name',
  'redcap_repeat_instrument',
  'redcap_repeat_instance',
  'trial_id',
  'source',
  'match_likelihood',
  'title',
  'overall_status',
  'period',
  'trial_phase',
  'conditions',
  'study_type',
  'description',
  'eligibility',
  'sponsor',
  'contact',
  'contact_phone',
  'contact_email',
  'facility_name_1',
  'facility_name_2',
  'facility_name_3',
  'facility_name_4',
  'facility_name_5',
  'pre_cancer_diagnosis',
  'cancer_diagnosis',
  'pre_cancer_subtype_other',
  'histology_other',
  'pre_stage',
  'stage',
  'ps_scale',
  'pre_ecog',
  'ecog',
  'pre_kps',
  'kps',
  'pre_metastasis_other',
  'sites_of_mets_other',
  'pre_age',
  'age',
  'pre_biomarker_count',
  'post_biomarker_count',
  'pre_biomarker_01',
  'post_biomarker_01',
  'pre_biomarker_02',
  'post_biomarker_02',
  'pre_biomarker_03',
  'post_biomarker_03',
  'pre_biomarker_04',
  'post_biomarker_04',
  'pre_biomarker_05',
  'post_biomarker_05',
  'pre_biomarker_06',
  'post_biomarker_06',
  'pre_biomarker_07',
  'post_biomarker_07',
  'pre_biomarker_08',
  'post_biomarker_08',
  'pre_biomarker_09',
  'post_biomarker_09',
  'pre_biomarker_10',
  'post_biomarker_10',
  'pre_radiation',
  'post_radiation',
  'pre_surgery',
  'post_surgery',
  'pre_medication',
  'post_medication',
  'tx_1',
  'pre_tx_1',
  'tx_2',
  'pre_tx_2',
  'tx_3',
  'pre_tx_3',
  'tx_4',
  'pre_tx_4',
  'tx_5',
  'pre_tx_5',
  'tx_6',
  'pre_tx_6',
  'tx_7',
  'pre_tx_7',
  'tx_8',
  'pre_tx_8',
  'tx_9',
  'pre_tx_9',
  'tx_10',
  'pre_tx_10',
  'tx_11',
  'pre_tx_11',
  'tx_12',
  'pre_tx_12',
  'tx_13',
  'pre_tx_13',
  'tx_14',
  'pre_tx_14',
  'tx_15',
  'pre_tx_15',
  'tx_16',
  'pre_tx_16',
  'tx_17',
  'pre_tx_17',
  'tx_18',
  'pre_tx_18',
  'tx_19',
  'pre_tx_19',
  'tx_20',
  'pre_tx_20',
  'bb_subject_id',
];

const getMainRow = (studyProps: StudyDetailProps, userId: string): Record<string, string> =>
  convertToSpreadsheetRow(
    [
      { header: MainRowKeys.trialId, body: studyProps.trialId },
      { header: MainRowKeys.source, body: studyProps.source },
      { header: MainRowKeys.likelihood, body: studyProps.likelihood?.text || '' },
      { header: MainRowKeys.title, body: studyProps.title || '' },
      { header: MainRowKeys.status, body: studyProps.status?.label || '' },
      { header: MainRowKeys.period, body: studyProps.period || '' },
      { header: MainRowKeys.phase, body: studyProps.phase || '' },
      { header: MainRowKeys.conditions, body: JSON.stringify(studyProps?.conditions) || '' },
      { header: MainRowKeys.type, body: studyProps.type?.label || studyProps.type?.name || '' },
      { header: MainRowKeys.description, body: studyProps.description || '' },
      { header: MainRowKeys.eligibility, body: studyProps.eligibility || '' },
      { header: MainRowKeys.sponsor, body: studyProps.sponsor?.name || '' },
      { header: MainRowKeys.contactName, body: studyProps.contacts?.[0]?.name || '' },
      { header: MainRowKeys.contactPhone, body: studyProps.contacts?.[0]?.phone || '' },
      { header: MainRowKeys.contactEmail, body: studyProps.contacts?.[0]?.email || '' },
    ],
    userId
  );

// NOTE: Uncomment this out to get facilities information
// const getSiteRow = (contact: ContactProps, userId: string): Record<string, string> =>
//   convertToSpreadsheetRow(
//     [
//       { header: SiteRowKeys.facility, body: contact['name'] },
//       ...(contact?.phone ? [{ header: SiteRowKeys.phone, body: contact['phone'] }] : []),
//       ...(contact?.email ? [{ header: SiteRowKeys.email, body: contact['email'] }] : []),
//     ],
//     userId
//   );

export const unpackStudies = (entries: StudyDetailProps[], userId: string): Record<string, string>[] => {
  const matchCount: StudyDetail[] = [{ header: 'Match Count', body: entries.length.toString() }];
  let data: Record<string, string>[] = [convertToSpreadsheetRow(matchCount, userId)];

  for (const entry of entries) {
    const mainRow = getMainRow(entry, userId);
    data = [...data, mainRow];

    /** TODO: To remove location multi-lined oddities, leave this out for now. */
    // const siteRows = entry.locations?.map(getContact).map(contact => getSiteRow(contact, userId));
    // const studyRow = [mainRow, ...(siteRows || [])];
    // data = [...data, ...studyRow];
  }

  return data;
};

const convertToSpreadsheetRow = (details: StudyDetail[], userId: string): Record<string, string> => {
  const newDatum = { 'User Id': userId };
  for (const detail of details) {
    newDatum[detail.header] = detail.body;
  }
  return newDatum;
};

export const exportCsvStringData = (patientSearch: FullSearchParameters, data: StudyDetailProps[]): string => {
  const patientElements = convertPatientInfoToRedCapRow(patientSearch);
  const bb_subject_id = uuidv4();
  const entries = data.map(entry => {
    const trialElements = convertResultsToRedCapRow(entry, patientSearch);
    return { ...trialElements, bb_subject_id };
  });
  return csvStringify([RedCapHeaders]) + csvStringify([{ ...patientElements }]) + csvStringify(entries);
};

const convertResultsToRedCapRow = (data: StudyDetailProps, patientSearch: FullSearchParameters) => {
  const travelDistance: number = parseInt(patientSearch.travelDistance);
  const facilities: string[] = [];
  // Go through the facilities and grab those that are within distance but also have a noteable name
  data.closestFacilities.forEach((facility: ContactProps) => {
    if (facility.distance?.quantity < travelDistance && facility?.name) facilities.push(facility.name);
  });

  if (data.trialId == 'NCT04768868') {
    console.log(
      'Closest Facilities',
      data.closestFacilities.map(f => f.name)
    );
    console.log('Facilities', facilities);
  }

  return {
    record_id: '',
    redcap_event_name: 'match_arm_1',
    redcap_repeat_instrument: 'trial_matches_intervention_arm_1',
    redcap_repeat_instance: 'new',
    trial_id: data.trialId,
    source: data.source,
    match_likelihood: data.likelihood?.text || '',
    title: data.title || '',
    overall_status: data.status?.label || '',
    period: data.period || '',
    trial_phase: data.phase || '',
    conditions: JSON.stringify(data?.conditions) || '',
    study_type: data.type?.label || data.type?.name || '',
    description: data.description || '',
    eligibility: data.eligibility || '',
    sponsor: data.sponsor?.name || '',
    contact: data.contacts?.[0]?.name || '',
    contact_phone: data.contacts?.[0]?.phone || '',
    contact_email: data.contacts?.[0]?.email || '',
    facility_name_1: facilities?.[0] || '',
    facility_name_2: facilities?.[1] || '',
    facility_name_3: facilities?.[2] || '',
    facility_name_4: facilities?.[3] || '',
    facility_name_5: facilities?.[4] || '',
    pre_cancer_diagnosis: '',
    cancer_diagnosis: '',
    pre_cancer_subtype_other: '',
    histology_other: '',
    pre_stage: '',
    stage: '',
    ps_scale: '',
    pre_ecog: '',
    ecog: '',
    pre_kps: '',
    kps: '',
    pre_metastasis_other: '',
    sites_of_mets_other: '',
    pre_age: '',
    age: '',
    pre_biomarker_count: '',
    post_biomarker_count: '',
    pre_biomarker_01: '',
    post_biomarker_01: '',
    pre_biomarker_02: '',
    post_biomarker_02: '',
    pre_biomarker_03: '',
    post_biomarker_03: '',
    pre_biomarker_04: '',
    post_biomarker_04: '',
    pre_biomarker_05: '',
    post_biomarker_05: '',
    pre_biomarker_06: '',
    post_biomarker_06: '',
    pre_biomarker_07: '',
    post_biomarker_07: '',
    pre_biomarker_08: '',
    post_biomarker_08: '',
    pre_biomarker_09: '',
    post_biomarker_09: '',
    pre_biomarker_10: '',
    post_biomarker_10: '',
    pre_radiation: '',
    post_radiation: '',
    pre_surgery: '',
    post_surgery: '',
    pre_medication: '',
    post_medication: '',
    tx_1: '',
    pre_tx_1: '',
    tx_2: '',
    pre_tx_2: '',
    tx_3: '',
    pre_tx_3: '',
    tx_4: '',
    pre_tx_4: '',
    tx_5: '',
    pre_tx_5: '',
    tx_6: '',
    pre_tx_6: '',
    tx_7: '',
    pre_tx_7: '',
    tx_8: '',
    pre_tx_8: '',
    tx_9: '',
    pre_tx_9: '',
    tx_10: '',
    pre_tx_10: '',
    tx_11: '',
    pre_tx_11: '',
    tx_12: '',
    pre_tx_12: '',
    tx_13: '',
    pre_tx_13: '',
    tx_14: '',
    pre_tx_14: '',
    tx_15: '',
    pre_tx_15: '',
    tx_16: '',
    pre_tx_16: '',
    tx_17: '',
    pre_tx_17: '',
    tx_18: '',
    pre_tx_18: '',
    tx_19: '',
    pre_tx_19: '',
    tx_20: '',
    pre_tx_20: '',
  };
};

// The same
const convertPatientInfoToRedCapRow = (patientSearch: FullSearchParameters) => {
  const ecogScore = patientSearch.ecogScore ? JSON.parse(patientSearch.ecogScore)?.valueInteger : '';
  const pre_ecogScore = patientSearch.pre_ecogScore ? JSON.parse(patientSearch.pre_ecogScore)?.valueInteger : '';
  const karnofskyScore = patientSearch.karnofskyScore ? JSON.parse(patientSearch.karnofskyScore)?.valueInteger : '';
  const pre_karnofskyScore = patientSearch.pre_karnofskyScore
    ? JSON.parse(patientSearch.pre_karnofskyScore)?.valueInteger
    : '';
  const cancerType: string = patientSearch.cancerType ? JSON.parse(patientSearch.cancerType)?.cancerType?.[0] : '';
  const pre_cancerType: string = patientSearch.pre_cancerType
    ? JSON.parse(patientSearch.pre_cancerType)?.cancerType?.[0]
    : '';
  const cancerSubtype: string = patientSearch.cancerSubtype
    ? JSON.parse(patientSearch.cancerSubtype)?.category?.[0]
    : '';
  const pre_cancerSubtype: string = patientSearch.pre_cancerSubtype
    ? JSON.parse(patientSearch.pre_cancerSubtype)?.category?.[0]
    : '';
  const metastasis: string = patientSearch.metastasis
    ? JSON.parse(patientSearch.metastasis)
        .map(metastasis => metastasis.category)
        .sort()
        .join(', ')
    : '';
  const pre_metastasis: string = patientSearch.pre_metastasis
    ? JSON.parse(patientSearch.pre_metastasis)
        .map(pre_metastasis => pre_metastasis.category)
        .sort()
        .join(', ')
    : '';
  const stage: string = patientSearch.stage ? JSON.parse(patientSearch.stage)?.category?.[0] : '';
  const pre_stage: string = patientSearch.pre_stage ? JSON.parse(patientSearch.pre_stage)?.category?.[0] : '';

  const biomarkers: string[] = patientSearch.biomarkers
    ? JSON.parse(patientSearch.biomarkers)
        .map(biomarker => {
          const qualifier =
            biomarker.qualifier?.code == '10828004' ? '+' : biomarker.qualifier?.code === '260385009' ? '-' : '';
          return biomarker.display + qualifier;
        })
        .sort()
    : [];

  const pre_biomarkers: string[] = patientSearch.pre_biomarkers
    ? JSON.parse(patientSearch.pre_biomarkers)
        .map(biomarker => {
          const qualifier =
            biomarker.qualifier?.code == '10828004' ? '+' : biomarker.qualifier?.code === '260385009' ? '-' : '';
          return biomarker.display + qualifier;
        })
        .sort()
    : [];

  // Get the count before setting the length of the biomarker arrays
  const pre_biomarkers_count = pre_biomarkers.length;
  const post_biomarkers_count = biomarkers.length;

  // Cut off length into 10
  biomarkers.length = 10;
  pre_biomarkers.length = 10;

  const pre_radiation: string[] = patientSearch.pre_radiation
    ? JSON.parse(patientSearch.pre_radiation)
        .map(radiation => radiation.display)
        .sort()
    : '';

  const radiation: string[] = patientSearch.radiation
    ? JSON.parse(patientSearch.radiation)
        .map(radiation => radiation.display)
        .sort()
    : '';

  const pre_medications: string[] = patientSearch.pre_medications
    ? JSON.parse(patientSearch.pre_medications)
        .map(medication => medication.display)
        .sort()
    : '';

  const medications: string[] = patientSearch.medications
    ? JSON.parse(patientSearch.medications)
        .map(medication => medication.display)
        .sort()
    : '';

  const pre_surgery: string[] = patientSearch.pre_surgery
    ? JSON.parse(patientSearch.pre_surgery)
        .map(surgery => surgery.display)
        .sort()
    : '';

  const surgery: string[] = patientSearch.surgery
    ? JSON.parse(patientSearch.surgery)
        .map(surgery => surgery.display)
        .sort()
    : '';

  // Combine radiation, surgery and medication arrays to display as treatments
  const treatments: string[] = [...radiation, ...surgery, ...medications];
  const pre_treatments: string[] = [...pre_radiation, ...pre_surgery, ...pre_medications];

  // Cut off length into 20
  treatments.length = 20;
  pre_treatments.length = 20;

  return {
    record_id: '',
    redcap_event_name: 'match_arm_2',
    redcap_repeat_instrument: '',
    redcap_repeat_instance: '',
    trial_id: '',
    source: '',
    match_likelihood: '',
    title: '',
    overall_status: '',
    period: '',
    trial_phase: '',
    conditions: '',
    study_type: '',
    description: '',
    eligibility: '',
    sponsor: '',
    contact: '',
    contact_phone: '',
    contact_email: '',
    facility_name_1: '',
    facility_name_2: '',
    facility_name_3: '',
    facility_name_4: '',
    facility_name_5: '',
    pre_cancer_diagnosis: pre_cancerType,
    cancer_diagnosis: cancerType,
    pre_cancer_subtype_other: pre_cancerSubtype,
    histology_other: cancerSubtype,
    pre_stage: pre_stage,
    stage: stage,
    ps_scale: karnofskyScore ? 1 : ecogScore || ecogScore === 0 ? 2 : '',
    pre_ecog: pre_ecogScore,
    ecog: ecogScore,
    pre_kps: pre_karnofskyScore,
    kps: karnofskyScore,
    pre_metastasis_other: pre_metastasis,
    sites_of_mets_other: metastasis,
    pre_age: patientSearch.pre_age,
    age: patientSearch.age || '',
    pre_biomarker_count: pre_biomarkers_count,
    post_biomarker_count: post_biomarkers_count,
    pre_biomarker_01: pre_biomarkers[0] || '',
    post_biomarker_01: biomarkers[0] || '',
    pre_biomarker_02: pre_biomarkers[1] || '',
    post_biomarker_02: biomarkers[1] || '',
    pre_biomarker_03: pre_biomarkers[2] || '',
    post_biomarker_03: biomarkers[2] || '',
    pre_biomarker_04: pre_biomarkers[3] || '',
    post_biomarker_04: biomarkers[3] || '',
    pre_biomarker_05: pre_biomarkers[4] || '',
    post_biomarker_05: biomarkers[4] || '',
    pre_biomarker_06: pre_biomarkers[5] || '',
    post_biomarker_06: biomarkers[5] || '',
    pre_biomarker_07: pre_biomarkers[6] || '',
    post_biomarker_07: biomarkers[6] || '',
    pre_biomarker_08: pre_biomarkers[7] || '',
    post_biomarker_08: biomarkers[7] || '',
    pre_biomarker_09: pre_biomarkers[8] || '',
    post_biomarker_09: biomarkers[8] || '',
    pre_biomarker_10: pre_biomarkers[9] || '',
    post_biomarker_10: biomarkers[9] || '',
    pre_radiation: pre_radiation.length,
    post_radiation: radiation.length,
    pre_surgery: pre_surgery.length,
    post_surgery: surgery.length,
    pre_medication: pre_medications.length,
    post_medication: medications.length,
    tx_1: treatments[0] || '',
    pre_tx_1: pre_treatments[0] || '',
    tx_2: treatments[1] || '',
    pre_tx_2: pre_treatments[1] || '',
    tx_3: treatments[2] || '',
    pre_tx_3: pre_treatments[2] || '',
    tx_4: treatments[3] || '',
    pre_tx_4: pre_treatments[3] || '',
    tx_5: treatments[4] || '',
    pre_tx_5: pre_treatments[4] || '',
    tx_6: treatments[5] || '',
    pre_tx_6: pre_treatments[5] || '',
    tx_7: treatments[6] || '',
    pre_tx_7: pre_treatments[6] || '',
    tx_8: treatments[7] || '',
    pre_tx_8: pre_treatments[7] || '',
    tx_9: treatments[8] || '',
    pre_tx_9: pre_treatments[8] || '',
    tx_10: treatments[9] || '',
    pre_tx_10: pre_treatments[9] || '',
    tx_11: treatments[10] || '',
    pre_tx_11: pre_treatments[10] || '',
    tx_12: treatments[11] || '',
    pre_tx_12: pre_treatments[11] || '',
    tx_13: treatments[12] || '',
    pre_tx_13: pre_treatments[12] || '',
    tx_14: treatments[13] || '',
    pre_tx_14: pre_treatments[13] || '',
    tx_15: treatments[14] || '',
    pre_tx_15: pre_treatments[14] || '',
    tx_16: treatments[15] || '',
    pre_tx_16: pre_treatments[15] || '',
    tx_17: treatments[16] || '',
    pre_tx_17: pre_treatments[16] || '',
    tx_18: treatments[17] || '',
    pre_tx_18: pre_treatments[17] || '',
    tx_19: treatments[18] || '',
    pre_tx_19: pre_treatments[18] || '',
    tx_20: treatments[19] || '',
    pre_tx_20: pre_treatments[19] || '',
  };
};
