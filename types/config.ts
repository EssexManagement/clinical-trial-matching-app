export type MatchingServiceConfig = {
  name: string;
  label: string;
  url: string;
  searchRoute: string;
  defaultValue: boolean;
  cancerTypes: string[];
};

export type PublicRuntimeConfig = {
  fhirClientId?: string;
  fhirRedirectUri?: string;
  fhirScope?: string;
  fhirQueryFlavor: string;
  defaultZipCode?: string;
  defaultTravelDistance?: string;
  sendLocationData: boolean;
  reactAppDebug: boolean;
  disableSearchLocation: boolean;
  defaultSearchZipCode?: string;
  defaultSearchTravelDistance?: string;
  resultsMax: number;
  siteRubric: string;
  services: MatchingServiceConfig[];
};

export type GetConfig = {
  publicRuntimeConfig: PublicRuntimeConfig;
};