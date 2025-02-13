import {
  LOINC_CODE_URI,
  ECOG_PERFORMANCE_STATUS_LOINC_CODE,
  KARNOFSKY_PERFORMANCE_STATUS_LOINC_CODE,
} from '@/utils/fhirConstants';
import {
  convertFhirEcogPerformanceStatus,
  convertFhirKarnofskyPerformanceStatus,
  convertFhirPatient,
  convertFhirRadiationProcedures,
  convertFhirSecondaryCancerConditions,
  convertFhirSurgeryProcedures,
  convertFhirTumorMarkers,
  convertFhirUser,
  extractMedicationCodes,
  extractPrimaryCancerCondition,
} from '@/utils/fhirConversionUtils';
import type Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';
import type { PatientData, ProgressMonitor } from '../fetchPatientData';
import { createQueryConfig, fetchMedications, fetchResources, observationHasCode, sortByDate } from '../fhir/fetch';
import { Condition, Medication, Observation, Procedure } from 'fhir/r4';

export type FetchTaskType = [
  fhirclient.FHIR.Patient,
  fhirclient.FHIR.Patient | fhirclient.FHIR.Practitioner | fhirclient.FHIR.RelatedPerson,
  Condition[],
  Observation[],
  Procedure[],
  Medication[]
];

// A bug in typescript prevents mapping tuples directly, so the MakePromises
// generic type is required.
type MakePromises<T> = { [K in keyof T]: Promise<T[K]> };

type FetchTaskPromiseType = MakePromises<FetchTaskType>;

/**
 * Fetch patient data from the FHIR client asynchronously, returning a PatientData object when complete.
 * @param fhirClient the FHIR client to use
 * @param progress a progress monitor to report progress as the load happens
 * @returns loaded patient data
 */
export const fetchPatientData = async (fhirClient: Client, progress: ProgressMonitor): Promise<PatientData> => {
  const tasks: FetchTaskPromiseType = [
    fhirClient.patient.read(),
    fhirClient.user.read(),
    fetchResources<Condition>(fhirClient, 'Condition', createQueryConfig('Condition')),
    fetchResources<Observation>(fhirClient, 'Observation', createQueryConfig('Observation')),
    fetchResources<Procedure>(fhirClient, 'Procedure', createQueryConfig('Procedure')),
    fetchMedications(fhirClient, createQueryConfig('MedicationRequest')),
  ];
  progress('Fetching patient data...', 0, tasks.length);

  const patientElements = (await Promise.all(
    tasks.map(promise =>
      promise.then(result => {
        progress(1);
        return result;
      })
    )
  )) as FetchTaskType;

  return buildPatientData(patientElements);
};

/**
 * This method is split out to make testing easier and is not intended to be used directly. Instead it should be called
 * via fetchPatientData().
 * @param param0 the loaded data
 * @returns
 */
export const buildPatientData = ([
  fhirPatient,
  fhirUser,
  conditions,
  observations,
  procedures,
  medications,
]: FetchTaskType): PatientData => {
  // Sort observations by date. This sorts in place, mutating the array.
  sortByDate(observations, 'effectiveDateTime');

  // TODO: As this gets more complicated, it'll make more sense to go through all observations and check each one to see
  // if it contains relavent information rather than do separate find/filters
  const ecogObservation = observations.find(resource =>
    observationHasCode(resource, LOINC_CODE_URI, ECOG_PERFORMANCE_STATUS_LOINC_CODE)
  );
  const karnosfkyObservation = observations.find(resource =>
    observationHasCode(resource, LOINC_CODE_URI, KARNOFSKY_PERFORMANCE_STATUS_LOINC_CODE)
  );

  return {
    patient: convertFhirPatient(fhirPatient),
    user: convertFhirUser(fhirUser),
    primaryCancerCondition: extractPrimaryCancerCondition(conditions),
    metastasis: convertFhirSecondaryCancerConditions(conditions),
    ecogScore: ecogObservation ? convertFhirEcogPerformanceStatus(ecogObservation) : null,
    karnofskyScore: karnosfkyObservation ? convertFhirKarnofskyPerformanceStatus(karnosfkyObservation) : null,
    biomarkers: convertFhirTumorMarkers(observations),
    radiation: convertFhirRadiationProcedures(procedures),
    surgery: convertFhirSurgeryProcedures(procedures),
    medications: extractMedicationCodes(medications),
  };
};

export default fetchPatientData;
