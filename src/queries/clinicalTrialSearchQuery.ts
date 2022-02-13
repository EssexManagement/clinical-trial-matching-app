import { StudyDetailProps } from '@/components/Results';
import { Patient, User } from '@/utils/fhirConversionUtils';
import { ResearchStudy } from 'fhir/r4';
import { ParsedUrlQuery } from 'querystring';

export type Results = {
  total: number;
  entry: StudyDetailProps[];
};

export type FilterOptions = {
  recruitmentStatus: { name: ResearchStudy['status']; label: string; count: number }[];
  trialPhase: { name: string; count: number }[];
  studyType: { name: string; count: number }[];
};

export type ResultsResponse = {
  results?: StudyDetailProps[];
  errors?: ErrorResponse[];
  filterOptions?: FilterOptions;
};

export type ErrorResponse = {
  status: string;
  response: string;
  serviceName: string;
  error?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const clinicalTrialSearchQuery = async (
  patient: Patient,
  user: User,
  searchParams: ParsedUrlQuery
): Promise<ResultsResponse> =>
  fetch('/api/clinical-trial-search', {
    cache: 'no-store',
    method: 'post',
    body: JSON.stringify({ patient, user, searchParams }, null, 2),
  }).then(res => res.json());

export default clinicalTrialSearchQuery;
