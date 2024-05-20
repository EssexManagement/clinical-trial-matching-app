import { Bundle } from 'fhir/r4';
import { fetchPatientData, buildPatientData } from '../fetchPatientData';
import type Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

const testPatient: fhirclient.FHIR.Patient = {
  resourceType: 'Patient',
  id: 'test-patient',
  name: [
    {
      given: ['Test'],
      family: 'User',
    },
  ],
};

// For now, the test user is always the patient
const testUser = testPatient;

describe('fetchPatientData', () => {
  it('fetches data', async () => {
    // This is a mock client, it's intentionally missing things the real one would have
    const fhirClient = {
      patient: {
        read: () => Promise.resolve(testPatient),
      },
      user: {
        read: () => Promise.resolve(testUser),
      },
      getPatientId: () => 'test-patient',
      request: async (query: string, options?: fhirclient.FhirOptions): Promise<Bundle | Bundle[]> => {
        // For now, always return an empty bundle (or an array of a single empty bundle)
        if ('pageLimit' in options) {
          return [
            {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [],
            },
          ];
        }
        return {
          resourceType: 'Bundle',
          type: 'searchset',
          entry: [],
        };
      },
    } as unknown as Client;
    const patientData = await fetchPatientData(fhirClient, () => {
      /* no-op */
    });
    // Basically, this should be blank
    // It might be worth checking to see if the expected queries were called,
    // but not really
    expect(patientData).toEqual({
      patient: {
        id: 'test-patient',
        name: 'Test User',
        gender: undefined,
        age: null,
        zipcode: null,
      },
      user: {
        id: 'test-patient',
        name: 'Test User',
        record: testPatient,
      },
      primaryCancerCondition: null,
      metastasis: [],
      diseaseStatus: null,
      ecogScore: null,
      karnofskyScore: null,
      biomarkers: [],
      radiation: [],
      surgery: [],
      medications: [],
    });
  });
});

describe('buildPatientData', () => {
  it('functions with no data read', () => {
    const patientData = buildPatientData([testPatient, testUser, [], [], [], []]);
    expect(typeof patientData).toEqual('object');
    expect(patientData).not.toBeNull();
  });
  it('finds disease status records', () => {
    const patientData = buildPatientData([
      testPatient,
      testUser,
      [],
      [
        // This is an abridged version of the example cancer disease status from the mCODE IG
        {
          resourceType: 'Observation',
          id: 'cancer-disease-status-improved-brian-l',
          meta: {
            profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-disease-status'],
          },
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '97509-4',
              },
            ],
          },
          subject: {
            reference: 'Patient/cancer-patient-brian-l',
          },
          effectiveDateTime: '2024-02-08',
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '268910001',
                display: "Patient's condition improved (finding)",
              },
            ],
          },
        },
      ],
      [],
      [],
    ]);
    expect(patientData.diseaseStatus).not.toBeNull();
    expect(patientData.diseaseStatus.system).toEqual('http://snomed.info/sct');
    expect(patientData.diseaseStatus.code).toEqual('268910001');
  });
  describe('biomarkers', () => {
    it('loads HER2 markers', () => {
      const patientData = buildPatientData([
        testPatient,
        testUser,
        [],
        [
          {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '51981-9',
                  display: 'HER2 [Presence] in Serum by Immunoassay',
                },
              ],
            },
            valueCodeableConcept: {
              coding: [
                {
                  code: '10828004',
                  display: 'Positive (qualifier value)',
                  system: 'http://snomed.info/sct',
                },
              ],
            },
          },
        ],
        [],
        [],
      ]);
      expect(patientData).not.toBeNull();
      expect(patientData.biomarkers).toEqual([
        {
          entryType: 'biomarkers',
          cancerType: ['breast', 'lung'],
          code: '51981-9',
          display: 'HER2 [Presence] in Serum by Immunoassay',
          system: 'http://loinc.org',
          category: ['HER2'],
          qualifier: {
            code: '10828004',
            display: 'Positive (qualifier value)',
            system: 'http://snomed.info/sct',
          },
        },
      ]);
    });
    it('loads ER markers', () => {
      const patientData = buildPatientData([
        testPatient,
        testUser,
        [],
        [
          {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '40556-3',
                  display: 'Estrogen receptor Ag [Presence] in Tissue by Immune stain',
                },
              ],
            },
            valueCodeableConcept: {
              coding: [
                {
                  code: '10828004',
                  display: 'Positive (qualifier value)',
                  system: 'http://snomed.info/sct',
                },
              ],
            },
          },
        ],
        [],
        [],
      ]);
      expect(patientData).not.toBeNull();
      expect(patientData.biomarkers).toEqual([
        {
          entryType: 'biomarkers',
          cancerType: ['breast', 'lung'],
          code: '40556-3',
          display: 'Estrogen receptor Ag [Presence] in Tissue by Immune stain',
          system: 'http://loinc.org',
          category: ['ER'],
          qualifier: {
            code: '10828004',
            display: 'Positive (qualifier value)',
            system: 'http://snomed.info/sct',
          },
        },
      ]);
    });
    it('loads PR markers', () => {
      const patientData = buildPatientData([
        testPatient,
        testUser,
        [],
        [
          {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '10861-3',
                },
              ],
            },
            valueCodeableConcept: {
              coding: [
                {
                  code: '260385009',
                  display: 'Negative (qualifier value)',
                  system: 'http://snomed.info/sct',
                },
              ],
            },
          },
        ],
        [],
        [],
      ]);
      expect(patientData).not.toBeNull();
      expect(patientData.biomarkers).toEqual([
        {
          entryType: 'biomarkers',
          cancerType: ['breast', 'lung'],
          code: '10861-3',
          display: 'Progesterone receptor [Mass/mass] in Tissue',
          system: 'http://loinc.org',
          category: ['PR'],
          qualifier: {
            code: '260385009',
            display: 'Negative (qualifier value)',
            system: 'http://snomed.info/sct',
          },
        },
      ]);
    });
  });
  describe('ECOG and Karnofsky', () => {
    it('loads ECOG Performance Status', () => {
      const patientData = buildPatientData([
        testPatient,
        testUser,
        [],
        [
          {
            resourceType: 'Observation',
            id: 'ecog-performance-status',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '89247-1',
                },
              ],
            },
            interpretation: [
              {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: 'LA9622-7',
                  },
                ],
              },
            ],
          },
        ],
        [],
        [],
      ]);
      expect(patientData.ecogScore).not.toBeNull();
      expect(patientData.ecogScore).toEqual({
        interpretation: {
          code: 'LA9622-7',
          display: 'Fully active, able to carry on all pre-disease performance without restriction',
          system: 'http://loinc.org',
        },
        valueInteger: 0,
        entryType: 'ecogScore',
      });
    });
    it('loads Karnofsky Performance Status', () => {
      const patientData = buildPatientData([
        testPatient,
        testUser,
        [],
        [
          {
            resourceType: 'Observation',
            id: 'karnofsky-performance-status',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '89243-0',
                },
              ],
            },
            valueInteger: 20,
          },
        ],
        [],
        [],
      ]);
      expect(patientData.karnofskyScore).not.toBeNull();
      expect(patientData.karnofskyScore).toEqual({
        interpretation: {
          display: 'Very sick; hospitalization necessary; active supportive treatment necessary',
          code: 'LA29183-3',
          system: 'http://loinc.org',
        },
        valueInteger: 20,
        entryType: 'karnofskyScore',
      });
    });
  });
});
