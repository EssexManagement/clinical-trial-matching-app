import {
  fhirEcogPerformanceStatusResource,
  fhirKarnofskyPerformanceStatusResource,
  fhirMedications,
  fhirPatient,
  fhirPrimaryCancerConditions,
  fhirPrimaryCancerConditions2,
  fhirRadiationProcedures,
  fhirSecondaryCancerConditions,
  fhirSurgeryProcedures,
  fhirTumorMarkers,
} from '@/__mocks__/bundles';
import mockPatient from '@/__mocks__/patient';
import { LOINC_CODE_URI, RXNORM_CODE_URI, SNOMED_CODE_URI } from '../fhirConstants';
import {
  CancerType,
  CodedValueType,
  convertFhirEcogPerformanceStatus,
  convertFhirKarnofskyPerformanceStatus,
  convertFhirPatient,
  convertFhirRadiationProcedures,
  convertFhirSecondaryCancerConditions,
  convertFhirSurgeryProcedures,
  convertFhirTumorMarkers,
  extractMedicationCodes,
  extractPrimaryCancerCondition,
  isEqualCodedValueType,
} from '../fhirConversionUtils';
import exp from 'constants';

describe('convertFhirKarnofskyPerformanceStatus', () => {
  it('gets the Karnofsky score from a bundle', () => {
    expect(convertFhirKarnofskyPerformanceStatus(fhirKarnofskyPerformanceStatusResource)).toEqual({
      entryType: 'karnofskyScore',
      interpretation: {
        code: 'LA29175-9',
        display: 'Normal; no complaints; no evidence of disease',
        system: LOINC_CODE_URI,
      },
      valueInteger: 100,
    });
  });
  it('returns null when no Karnosky score is present', () => {
    // Use the ECOG performance score resource - this should be ignored
    expect(convertFhirKarnofskyPerformanceStatus(fhirEcogPerformanceStatusResource)).toBeNull();
  });
});

describe('convertFhirEcogPerformanceStatus', () => {
  it('gets the ECOG score from a FHIR bundle', () => {
    expect(convertFhirEcogPerformanceStatus(fhirEcogPerformanceStatusResource)).toEqual({
      entryType: 'ecogScore',
      interpretation: {
        code: 'LA9623-5',
        display:
          'Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature, e.g., light house work, office work',
        system: LOINC_CODE_URI,
      },
      valueInteger: 1,
    });
  });
});

describe('extractMedicationCodes', () => {
  it('gets the medication codes from a set of medications', () => {
    expect(extractMedicationCodes(fhirMedications)).toEqual([
      {
        cancerType: [CancerType.PROSTATE],
        category: ['Leuprolide'],
        code: '1163443',
        display: 'Leuprolide Injectable Product',
        entryType: 'medications',
        system: RXNORM_CODE_URI,
      },
      {
        cancerType: [CancerType.BREAST],
        category: ['Fulvestrant'],
        code: '1156671',
        display: 'Fulvestrant Injectable Product',
        entryType: 'medications',
        system: RXNORM_CODE_URI,
      },
      {
        cancerType: [CancerType.BREAST],
        category: ['Abemaciclib'],
        code: '1946828',
        display: 'Abemaciclib Pill',
        entryType: 'medications',
        system: RXNORM_CODE_URI,
      },
      {
        cancerType: [CancerType.BREAST],
        category: ['Ribociclib'],
        code: '1873980',
        display: 'Ribociclib Oral Product',
        entryType: 'medications',
        system: RXNORM_CODE_URI,
      },
    ]);
    expect(extractMedicationCodes([])).toEqual([]);
  });
});

describe('convertFhirPatient', () => {
  it('gets the patient from a FHIR Patient', () => {
    jest.spyOn(Date, 'now').mockImplementationOnce(() => Date.UTC(1987, 11, 3));
    expect(convertFhirPatient(fhirPatient)).toEqual(mockPatient);
  });
});

describe('convertFhirPrimaryCancerCondition', () => {
  it('gets the primary cancer condition from a FHIR Bundle', () => {
    const cancerCondition = extractPrimaryCancerCondition(fhirPrimaryCancerConditions);
    expect(cancerCondition.cancerType).toEqual({
      entryType: 'cancerType',
      cancerType: [CancerType.BREAST],
      code: '408643008',
      display: 'Infiltrating duct carcinoma of breast (disorder)',
      system: SNOMED_CODE_URI,
      category: ['Breast', 'Invasive Breast', 'Invasive Carcinoma', 'Invasive Ductal Carcinoma'],
    });
    expect(cancerCondition.stage).toBeNull();
    expect(cancerCondition.cancerSubtype).toHaveProperty('entryType', 'cancerSubtype');
    expect(cancerCondition.cancerSubtype).toHaveProperty('code', '128700001');
    expect(cancerCondition.cancerSubtype).toHaveProperty(
      'display',
      'Infiltrating duct mixed with other types of carcinoma (morphologic abnormality)'
    );
    expect(cancerCondition.cancerSubtype).toHaveProperty('system', SNOMED_CODE_URI);
    expect(cancerCondition.cancerSubtype).toHaveProperty('category', [
      'Invasive',
      'Invasive Carcinoma',
      'Invasive Carcinoma Mixed',
      'Invasive Ductal Carcinoma',
    ]);
    const cancerCondition2 = extractPrimaryCancerCondition(fhirPrimaryCancerConditions2);
    expect(cancerCondition2.cancerType).toEqual({
      entryType: 'cancerType',
      cancerType: [CancerType.BREAST],
      code: '254837009',
      display: 'Malignant neoplasm of breast (disorder)',
      system: SNOMED_CODE_URI,
      category: ['Breast'],
    });
    expect(cancerCondition2.cancerSubtype).toBeNull();
    expect(cancerCondition2.stage).toHaveProperty('entryType', 'stage');
    expect(cancerCondition2.stage).toHaveProperty('code', '261614003');
    expect(cancerCondition2.stage).toHaveProperty('display', 'Stage 2A');
    expect(cancerCondition2.stage).toHaveProperty('system', SNOMED_CODE_URI);
    expect(cancerCondition2.stage).toHaveProperty('category', ['2']);
  });
});

describe('convertFhirRadiationProcedures', () => {
  it('gets the radiation procedures from a FHIR Bundle', () => {
    const rads = convertFhirRadiationProcedures(fhirRadiationProcedures);
    expect(rads).toHaveLength(2);
    expect(rads).toHaveProperty('0.entryType', 'radiation');
    expect(rads).toHaveProperty('0.code', '879916008');
    expect(rads).toHaveProperty('0.display', 'Radiofrequency ablation (procedure)');
    expect(rads).toHaveProperty('0.system', SNOMED_CODE_URI);
    expect(rads).toHaveProperty('0.category', ['Ablation', 'RFA']);
    expect(rads).toHaveProperty('1.entryType', 'radiation');
    expect(rads).toHaveProperty('1.code', '399315003');
    expect(rads).toHaveProperty('1.display', 'Radionuclide therapy (procedure)');
    expect(rads).toHaveProperty('1.system', SNOMED_CODE_URI);
    expect(rads).toHaveProperty('1.category', ['EBRT']);
  });
});

describe('convertFhirSecondaryCancerConditions', () => {
  it('gets the secondary cancer conditions from a FHIR Bundle', () => {
    const mets = convertFhirSecondaryCancerConditions(fhirSecondaryCancerConditions);
    expect(mets).toHaveLength(1);
    expect(mets).toHaveProperty('0.entryType', 'metastasis');
    expect(mets).toHaveProperty('0.code', '94222008');
    expect(mets).toHaveProperty('0.display', 'Secondary malignant neoplasm of bone');
    expect(mets).toHaveProperty('0.system', SNOMED_CODE_URI);
    expect(mets).toHaveProperty('0.category', ['Bone']);
  });
});

describe('convertFhirSurgeryProcedures', () => {
  it('gets the surgery procedures from a FHIR Bundle', () => {
    expect(convertFhirSurgeryProcedures(fhirSurgeryProcedures)).toEqual([
      {
        entryType: 'surgery',
        cancerType: [CancerType.BREAST],
        code: '64368001',
        display: 'Partial mastectomy (procedure)',
        system: SNOMED_CODE_URI,
        category: ['Mastectomy'],
      },
      {
        entryType: 'surgery',
        cancerType: [CancerType.BREAST],
        code: '234262008',
        display: 'Excision of axillary lymph node (procedure)',
        system: SNOMED_CODE_URI,
        category: ['Alnd'],
      },
      {
        entryType: 'surgery',
        cancerType: [CancerType.BREAST],
        code: '69031006',
        display: 'Excision of breast tissue (procedure)',
        system: SNOMED_CODE_URI,
        category: ['Mastectomy'],
      },
    ]);
  });
});

describe('convertFhirTumorMarkers', () => {
  it('gets the tumor markers from a FHIR Bundle', () => {
    const biomarkers = convertFhirTumorMarkers(fhirTumorMarkers).slice(0, 3);
    expect(biomarkers).toHaveLength(3);
    expect(biomarkers).toHaveProperty('0.entryType', 'biomarkers');
    expect(biomarkers).toHaveProperty('0.code', '40556-3');
    expect(biomarkers).toHaveProperty('0.display', 'Estrogen receptor Ag [Presence] in Tissue by Immune stain');
    expect(biomarkers).toHaveProperty('0.system', LOINC_CODE_URI);
    expect(biomarkers).toHaveProperty('0.category', ['ER']);
    expect(biomarkers).toHaveProperty('0.qualifier.system', SNOMED_CODE_URI);
    expect(biomarkers).toHaveProperty('0.qualifier.code', '10828004');
    expect(biomarkers).toHaveProperty('0.qualifier.display', 'Positive (qualifier value)');
    expect(biomarkers).toHaveProperty('1.entryType', 'biomarkers');
    expect(biomarkers).toHaveProperty('1.code', '40557-1');
    expect(biomarkers).toHaveProperty('1.display', 'Progesterone receptor Ag [Presence] in Tissue by Immune stain');
    expect(biomarkers).toHaveProperty('1.system', LOINC_CODE_URI);
    expect(biomarkers).toHaveProperty('1.category', ['PR']);
    expect(biomarkers).toHaveProperty('1.qualifier.system', SNOMED_CODE_URI);
    expect(biomarkers).toHaveProperty('1.qualifier.code', '10828004');
    expect(biomarkers).toHaveProperty('1.qualifier.display', 'Positive (qualifier value)');
    expect(biomarkers).toHaveProperty('2.entryType', 'biomarkers');
    expect(biomarkers).toHaveProperty('2.code', '18474-7');
    expect(biomarkers).toHaveProperty('2.display', 'HER2 Ag [Presence] in Tissue by Immune stain');
    expect(biomarkers).toHaveProperty('2.system', LOINC_CODE_URI);
    expect(biomarkers).toHaveProperty('2.category', ['HER2']);
    expect(biomarkers).toHaveProperty('2.qualifier.system', SNOMED_CODE_URI);
    expect(biomarkers).toHaveProperty('2.qualifier.code', '260385009');
    expect(biomarkers).toHaveProperty('2.qualifier.display', 'Negative (qualifier value)');
  });
});

describe('isEqualCodedValueType()', () => {
  it('returns true if two values are equal', () => {
    expect(
      // Same codes but with the categories flipped
      isEqualCodedValueType(
        {
          cancerType: [CancerType.BRAIN, CancerType.BREAST],
          category: ['category1', 'category2'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        },
        {
          cancerType: [CancerType.BRAIN, CancerType.BREAST],
          category: ['category1', 'category2'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        }
      )
    ).toBe(true);
  });
  it('returns false if values are not equal', () => {
    expect(
      // Same codes but with the categories flipped
      isEqualCodedValueType(
        {
          cancerType: [CancerType.BRAIN, CancerType.BREAST],
          category: ['category1', 'category2'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        },
        {
          cancerType: [CancerType.BRAIN, CancerType.BREAST, CancerType.COLON],
          category: ['category1', 'category2', 'category3'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        }
      )
    ).toBe(false);
  });
  it('checkes if two values are equal even if values are out of order', () => {
    expect(
      // Same codes but with the categories flipped
      isEqualCodedValueType(
        {
          cancerType: [CancerType.BRAIN, CancerType.BREAST],
          category: ['category1', 'category2'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        },
        {
          cancerType: [CancerType.BREAST, CancerType.BRAIN],
          category: ['category2', 'category1'],
          code: 'code',
          display: 'display',
          entryType: 'cancerType',
          system: 'http://snomed.info/sct',
        }
      )
    ).toBe(true);
  });
  it('accepts missing cancer type/category', () => {
    const missingCancerType = {
      category: ['brain'],
      code: 'code',
      display: 'display',
      entryType: 'cancerType',
      system: 'http://snomed.info/sct',
    } as CodedValueType;
    const missingCategory = {
      cancerType: [CancerType.BRAIN],
      code: 'code',
      display: 'display',
      entryType: 'cancerType',
      system: 'http://snomed.info/sct',
    } as CodedValueType;
    expect(isEqualCodedValueType(missingCancerType, missingCategory)).toBe(false);
    expect(isEqualCodedValueType(missingCategory, missingCancerType)).toBe(false);
    expect(isEqualCodedValueType(missingCancerType, missingCancerType)).toBe(true);
    expect(isEqualCodedValueType(missingCategory, missingCategory)).toBe(true);
  });
});
