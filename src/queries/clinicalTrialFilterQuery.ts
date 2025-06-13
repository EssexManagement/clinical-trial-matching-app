import { ensureArray } from '@/components/Sidebar/Sidebar';
import { getFilteredResults, getFilterOptions, getKeywordOptions, getSortedResults } from '@/utils/filterUtils';
import { ParsedUrlQuery } from 'querystring';
import { FilterParameters, SortingParameters } from 'types/search-types';
import { ResultsResponse } from './clinicalTrialSearchQuery';
import { StudyDetailProps } from '@/components/Results';

const clinicalTrialFilterQuery = async (
  response: ResultsResponse,
  searchParams: ParsedUrlQuery,
  showKeyword: boolean
): Promise<ResultsResponse> => {
  const sortingParameters: SortingParameters = {
    sortingOption: searchParams.sortingOption as string,
    savedStudies: ensureArray(searchParams.savedStudies),
  };
  const filterParameters: FilterParameters = {
    recruitmentStatus: ensureArray(searchParams.recruitmentStatus),
    trialPhase: ensureArray(searchParams.trialPhase),
    studyType: ensureArray(searchParams.studyType),
  };

  const sorted = getSortedResults(response.results, sortingParameters);
  const filtered = getFilteredResults(sorted, filterParameters);
  const searchKeywords = ensureArray(searchParams.keywordSearch);
  const keywordPatterns = searchKeywords.map(value => new RegExp(value, 'i'));
  const keywordFiltered =
    keywordPatterns.length && showKeyword
      ? filtered.filter(trial => {
          const trialSerialized = serializeTrial(trial);
          return keywordPatterns.every(pattern => pattern.test(trialSerialized));
        })
      : filtered;

  // Dynamically generate filter options
  const filterOptions = getFilterOptions(sorted, filterParameters);
  const keywordOptions = getKeywordOptions(sorted);

  return { ...response, results: keywordFiltered, filterOptions, keywordOptions };
};

export default clinicalTrialFilterQuery;

function serializeTrial(trial: StudyDetailProps): string {
  const startOfExclusionCrit = trial.eligibility?.match(/exclusion criteria/i)?.index;
  const inclusionCrit = trial.eligibility?.slice(0, startOfExclusionCrit) || '';
  return (
    JSON.stringify(trial.conditions) +
    trial.description +
    (inclusionCrit || trial.eligibility) +
    JSON.stringify(trial.keywords) +
    trial.title
  );
}
