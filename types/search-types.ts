export type FullSearchParameters = SearchParameters & SortingParameters & FilterParameters;

export type SearchParameters = {
  matchingServices: string[];
  zipcode: string;
  travelDistance: string;
  age: string;
  // This is the "administrative gender" of the patient.
  gender: string;
  cancerType: string;
  cancerSubtype: string;
  metastasis: string[];
  stage: string;
  ecogScore: string;
  karnofskyScore: string;
  biomarkers: string[];
  surgery: string[];
  medications: string[];
  radiation: string[];
};

export type FilterParameters = {
  recruitmentStatus: string[];
  trialPhase: string[];
  studyType: string[];
};

export type SortingParameters = {
  sortingOptions: string[];
  savedStudies?: string[];
};
