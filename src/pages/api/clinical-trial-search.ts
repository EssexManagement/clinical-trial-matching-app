import { BundleEntry, StudyDetailProps } from '@/components/Results';
import { getStudyDetailProps } from '@/components/Results/utils';
import { Service } from '@/queries/clinicalTrialSearchQuery';
import * as fhirConstants from '@/utils/fhirConstants';
import { CodedValueType, parseCodedValue as parseCodedValueType } from '@/utils/fhirConversionUtils';
import {
  addCancerHistologyMorphology,
  addCancerType,
  convertCodedValueToMedicationStatement as convertCodedValueToMedicationStatement,
  convertCodedValueToObervation as convertCodedValueTypeToObservation,
  convertStringToObservation,
} from '@/utils/fhirFilter';
import { isAdministrativeGender } from '@/utils/fhirTypeGuards';
import type { Bundle, Condition, FhirResource, Parameters, Patient, Reference } from 'fhir/r4';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import { SearchParameters } from 'types/search-types';

const {
  publicRuntimeConfig: { sendLocationData, defaultZipCode, reactAppDebug, services },
} = getConfig();

/**
 * API/Query handler For clinical-trial-search
 *
 * @param req Should contain { patient, user, searchParams }
 * @param res Returns { results, errors }
 */
const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { searchParams } = JSON.parse(req.body);

  const patientBundle: Bundle = buildBundle(searchParams);

  const chosenServices =
    searchParams.matchingServices && Array.isArray(searchParams.matchingServices)
      ? searchParams.matchingServices
      : [searchParams.matchingServices];

  const results = await callWrappers(chosenServices, patientBundle, searchParams['zipcode']);
  res.status(200).json(results);
};

/**
 * Builds bundle with search parameter and entries
 *
 * @param searchParams
 * @returns
 */
export function buildBundle(searchParams: SearchParameters): Bundle {
  const zipCode = sendLocationData ? searchParams['zipcode'] : defaultZipCode;
  const travelDistance = sendLocationData ? searchParams['travelDistance'] : undefined;

  !sendLocationData && console.log(`Using default zip code ${defaultZipCode} and travel distance ${travelDistance}`);

  const trialParams: Parameters = {
    resourceType: 'Parameters',
    id: '0',
    parameter: [
      ...(zipCode ? [{ name: 'zipCode', valueString: zipCode }] : []),
      ...(travelDistance ? [{ name: 'travelRadius', valueString: travelDistance }] : []),
    ],
  };

  // Create our stub patient
  const patient: Patient = {
    resourceType: 'Patient',
    id: 'search_patient',
  };
  // Add whatever we can
  if (isAdministrativeGender(searchParams.gender)) {
    patient.gender = searchParams.gender;
  }
  if (searchParams.age) {
    const age = Number(searchParams.age);
    if (!isNaN(age)) {
      // For the age, calculate a year based on today's date and just store that. Just a year is a valid FHIR date.
      patient.birthDate = (new Date().getUTCFullYear() - age).toString();
    }
  }

  // Initialize a patient bundle with our search information.
  const patientBundle: Bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [{ resource: trialParams }, { resource: patient, fullUrl: 'urn:uuid:1' }],
  };

  // Create a reference for the patient, which will be used to refer to it later
  const patientReference: Reference = {
    reference: 'urn:uuid:1',
    type: 'Patient',
  };

  // Now that we have the complete bundle, we can mutate if necessary from the search parameters. Restore the named
  // codes if they exist.
  let id = '';
  let profileValue = '';
  let codingSystem = '';
  let codingSystemCode = '';
  let searchOptionValue = '';

  const cancerType = parseCodedValueType(searchParams['cancerType']);
  let cancerRecord: Condition;
  if (cancerType) {
    cancerRecord = addCancerType(patientBundle, patientReference, cancerType);
  }
  const cancerSubtype = parseCodedValueType(searchParams['cancerSubtype']);
  if (cancerSubtype) {
    addCancerHistologyMorphology(cancerRecord ? cancerRecord : patientBundle, patientReference, cancerSubtype);
  }

  searchOptionValue = searchParams['ecogScore'];

  id = 'mcode-ecog-performance-status';
  profileValue = fhirConstants.MCODE_ECOG_PERFORMANCE_STATUS;
  codingSystemCode = '89247-1';
  addStringValueToBundle({
    patientBundle,
    searchOptionValues: searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    codingSystemCode,
    subject: patientReference,
  });

  searchOptionValue = searchParams['karnofskyScore'];
  id = 'mcode-karnofsky-performance-status';
  profileValue = fhirConstants.MCODE_KARNOFSKY_PERFORMANCE_STATUS;
  codingSystem = 'https://loinc.org';
  codingSystemCode = 'LL4986-7';

  addStringValueToBundle({
    patientBundle,
    searchOptionValues: searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    codingSystemCode,
    subject: patientReference,
  });

  id = 'mcode-cancer-stage-group';
  profileValue = fhirConstants.MCODE_CANCER_STAGE_GROUP;

  addCodedValueToBundle({
    patientBundle,
    searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    subject: patientReference,
  });

  const metastasisPararameter = searchParams.metastasis;
  if (metastasisPararameter) {
    // NOSONAR
    id = 'tnm-clinical-distant-metastases-category-cM0';
    profileValue = fhirConstants.MCODE_CLINICAL_DISTANT_METASTASIS;

    addStringValueToBundle({
      patientBundle,
      searchOptionValues: metastasisPararameter,
      id,
      profile_value: profileValue,
      codingSystem,
      codingSystemCode,
      subject: patientReference,
    });
  }

  searchOptionValue = searchParams['biomarkers'];
  profileValue = fhirConstants.MCODE_TUMOR_MARKER;
  id = 'mcode-tumor-marker';
  addCodedValueToBundle({
    patientBundle,
    searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    subject: patientReference,
  });

  searchOptionValue = searchParams['medications'];

  id = 'mcode-cancer-related-medication-statement';
  profileValue = fhirConstants.MCODE_CANCER_RELATED_MEDICATION_STATEMENT;
  addCodedValueToBundle({
    patientBundle,
    searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    subject: patientReference,
  });

  searchOptionValue = searchParams['surgery'];

  id = 'mcode-cancer-related-surgical-procedure';
  profileValue = fhirConstants.MCODE_CANCER_RELATED_SURGICAL_PROCEDURE;
  addCodedValueToBundle({
    patientBundle,
    searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    subject: patientReference,
  });

  searchOptionValue = searchParams['radiation'];

  id = 'mcode-cancer-related-radiation-procedure';
  profileValue = fhirConstants.MCODE_CANCER_RELATED_RADIATION_PROCEDURE;
  addCodedValueToBundle({
    patientBundle,
    searchOptionValue,
    id,
    profile_value: profileValue,
    codingSystem,
    subject: patientReference,
  });

  if (reactAppDebug) {
    console.log(JSON.stringify(patientBundle, null, 2));
  }

  return patientBundle;
}
/**
 * Calls all selected wrappers and combines the results
 *
 * @param matchingServices Selected matching services to use
 * @param query Query to be sent to all matching services
 * @param patientZipCode Patient's zip code which may not have been sent to matching services
 * @returns Responses from called wrappers
 */
async function callWrappers(matchingServices: string[], query: Bundle, patientZipCode: string) {
  const wrapperResults = await Promise.all(
    matchingServices.map(async name => {
      const { url, searchRoute, label } = services.find((service: Service) => service.name === name);
      const results = await callWrapper(url + searchRoute, JSON.stringify(query, null, 2), label);
      return results;
    })
  );

  // Separate out responses that were unsuccessful
  const errors = wrapperResults.filter(result => result.status == 500);

  // Combine the responses that were successful
  const combined: StudyDetailProps[] = [];
  const uniqueTrialIds = new Set<string>();

  wrapperResults
    .filter(result => result.status == 200)
    .forEach(searchset => {
      // Add the count to the total
      // Transform each of the studies in the bundle
      searchset?.response?.entry.forEach((entry: BundleEntry) => {
        const otherTrialId = entry.resource.identifier?.[0]?.value;
        const foundDuplicateTrial = uniqueTrialIds.has(otherTrialId);
        if (!foundDuplicateTrial) {
          uniqueTrialIds.add(otherTrialId);
          combined.push(getStudyDetailProps(entry, patientZipCode));
        }
      });
    });

  return { results: combined, errors };
}

/**
 * Calls a single wrapper
 *
 * @param url URL to send POST to
 * @param query Query to send to URL
 * @param serviceName Name of the service
 * @returns Response from wrapper
 */
async function callWrapper(url: string, query: string, serviceName: string) {
  return fetch(url, {
    cache: 'no-store',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: query,
  })
    .then(handleError)
    .then(response => response.json())
    .then(data => {
      return { status: 200, response: data };
    })
    .catch(error => {
      return {
        status: 500,
        response: 'There was an issue receiving responses from ' + serviceName,
        serviceName,
        error,
      };
    });
}

/**
 * Throws an Error if status is not 2xx
 * @param response Wrapper response
 * @returns Response if 2xx
 */
function handleError(response) {
  if (!response.ok) {
    throw Error();
  }
  return response;
}

function addCodedValueToBundle({
  patientBundle,
  searchOptionValue,
  id,
  profile_value,
  codingSystem,
  subject,
}: {
  patientBundle: Bundle;
  searchOptionValue: string;
  id: string;
  profile_value: string;
  codingSystem: string;
  subject: Reference;
}): void {
  if (searchOptionValue != '') {
    const codedValueArray: CodedValueType[] = JSON.parse(searchOptionValue);

    let resource: FhirResource;
    if (codedValueArray.length > 0) {
      // NOSONAR
      for (const codedValue of codedValueArray) {
        if (profile_value == fhirConstants.MCODE_CANCER_RELATED_MEDICATION_STATEMENT) {
          codingSystem = 'https://www.nlm.nih.gov/research/umls/rxnorm';
          resource = convertCodedValueToMedicationStatement({
            codedValue,
            id,
            profile_value,
            codingSystem,
            subject,
          });
        } else {
          codingSystem = 'https://snomed.info/sct';
          resource = convertCodedValueTypeToObservation({
            codedValue,
            id,
            profile_value,
            codingSystem,
            subject,
          });
        }
        patientBundle.entry.push({ resource: resource });
      }
    }
  }
}

function addStringValueToBundle({
  patientBundle,
  searchOptionValues,
  id,
  profile_value,
  codingSystem,
  codingSystemCode,
  subject,
}: {
  patientBundle: Bundle;
  searchOptionValues: string | string[];
  id: string;
  profile_value: string;
  codingSystem: string;
  codingSystemCode: string;
  subject?: Reference;
}): void {
  if (Array.isArray(searchOptionValues)) {
    for (const searchOption of searchOptionValues) {
      const resource = convertStringToObservation({
        valueString: searchOption,
        id,
        profile_value,
        codingSystem,
        codingSystemCode,
        subject,
      });
      patientBundle.entry.push({ resource: resource });
    }
  } else {
    if (searchOptionValues) {
      const resource = convertStringToObservation({
        valueString: searchOptionValues,
        id,
        profile_value,
        codingSystem,
        codingSystemCode,
        subject,
      });
      patientBundle.entry.push({ resource: resource });
    }
  }
}

export default handler;
