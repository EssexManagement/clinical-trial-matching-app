import SearchImage from '@/assets/images/search.png';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/queries/clinicalTrialPaginationQuery';
import { CodedValueType } from '@/utils/fhirConversionUtils';
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import { Box, Button, Grid, Stack, useMediaQuery, useTheme } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ReactElement, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { SearchParameters } from 'types/search-types';
import {
  AgeTextField,
  areCodedValueTypesEqual,
  BiomarkersAutocomplete,
  CancerStageAutocomplete,
  CancerSubtypeAutocomplete,
  CancerTypeAutocomplete,
  ECOGScoreAutocomplete,
  KarnofskyScoreAutocomplete,
  MedicationsAutocomplete,
  MetastasisAutocomplete,
  RadiationAutocomplete,
  SurgeryAutocomplete,
  TravelDistanceTextField,
  ZipcodeTextField,
} from './FormFields';
import { getNewState, uninitializedState } from './FormFieldsOptions';
import MatchingServices from './MatchingServices';
import { SearchFormValuesType, State } from './types';

export type SearchFormProps = {
  defaultValues: Partial<SearchFormValuesType>;
  fullWidth?: boolean;
};

export const formDataToSearchQuery = (data: SearchFormValuesType): SearchParameters => ({
  ...data,
  // For the cancer types, encode the JSON objects
  // Boolean check is because JSON.stringify(null) === "null" and should be omitted
  cancerType: data.cancerType ? JSON.stringify(data.cancerType) : undefined,
  cancerSubtype: data.cancerSubtype ? JSON.stringify(data.cancerSubtype) : undefined,
  metastasis: data.metastasis ? JSON.stringify(data.metastasis) : undefined,
  biomarkers: data.biomarkers ? JSON.stringify(data.biomarkers) : undefined,
  stage: data.stage ? JSON.stringify(data.stage) : undefined,
  medications: data.medications ? JSON.stringify(data.medications) : undefined,
  surgery: data.surgery ? JSON.stringify(data.surgery) : undefined,
  radiation: data.radiation ? JSON.stringify(data.radiation) : undefined,
  matchingServices: Object.keys(data.matchingServices).filter(service => data.matchingServices[service]),
  karnofskyScore: data.karnofskyScore ? JSON.stringify(data.karnofskyScore) : undefined,
  ecogScore: data.ecogScore ? JSON.stringify(data.ecogScore) : undefined,
});

const SearchForm = ({ defaultValues, fullWidth }: SearchFormProps): ReactElement => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { handleSubmit, control, getValues } = useForm<SearchFormValuesType>({ defaultValues });
  const [state, setState] = useState<State>(getNewState(defaultValues.cancerType));

  const onSubmit = (data: SearchFormValuesType) => {
    return router.push({
      pathname: '/results',
      query: {
        ...formDataToSearchQuery(data),
        sortingOption: 'matchLikelihood',
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
      },
    });
  };

  const onDownload = (data: SearchFormValuesType) => {
    // For this, just use window.location to trigger a download
    const params = new URLSearchParams();
    const query = formDataToSearchQuery(data);
    for (const key in query) {
      const value = query[key];
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
    window.location.assign(`/api/search-csv?${params}`);
  };

  const retrieveCancer = (cancerType: CodedValueType): void => {
    if (!!cancerType?.entryType) {
      setState(getNewState(cancerType));
    } else {
      setState({ ...uninitializedState, cancerType: state.cancerType });
    }
  };

  const validateCancerSubtype = (): boolean => {
    return (
      !getValues('cancerSubtype') ||
      (!!getValues('cancerSubtype') &&
        state.cancerSubtype.some(subtype => areCodedValueTypesEqual(subtype, getValues('cancerSubtype'))))
    );
  };

  const validateStage = (): boolean => {
    return (
      !getValues('stage') ||
      (!!getValues('stage') && state.stage.some(subtype => areCodedValueTypesEqual(subtype, getValues('stage'))))
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box bgcolor="grey.200">
        {!(fullWidth || isSmallScreen) && (
          <Box p={{ xs: 0, md: 2 }}>
            <Stack alignItems="center" direction={{ xs: 'column', lg: 'row' }} justifyContent="center">
              <Box>
                <Image
                  src={SearchImage}
                  alt="Clinical Trial Finder Search"
                  layout="fixed"
                  width={400}
                  height={190}
                  priority
                />
              </Box>

              <Box ml={{ md: 0, lg: 10 }} textAlign={{ xs: 'center', lg: 'left' }}>
                <Box fontSize={{ xs: 30, lg: 38, xl: 63 }} fontWeight={300}>
                  Let's find some clinical trials
                </Box>

                <Box color="grey.600" fontSize={{ xs: 20, lg: 25, xl: 28 }} fontWeight={300}>
                  Search with data populated from your record, or change to find matching trials
                </Box>
              </Box>
            </Stack>
          </Box>
        )}

        <Grid columns={8} container spacing={2} px={2} py={fullWidth ? 0 : { md: 2 }} pb={{ xs: 2 }} mt={0}>
          <Grid item xs={8}>
            <MatchingServices {...{ control, fullWidth }} />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller
              name="zipcode"
              defaultValue=""
              control={control}
              rules={{ required: true }}
              render={ZipcodeTextField}
            />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller name="travelDistance" defaultValue="" control={control} render={TravelDistanceTextField} />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller name="age" defaultValue="" control={control} render={AgeTextField} />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller
              name="cancerType"
              defaultValue={null}
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CancerTypeAutocomplete field={field} cancerTypes={state.cancerType} retrieveCancer={retrieveCancer} />
              )}
            />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller
              name="cancerSubtype"
              defaultValue={null}
              control={control}
              rules={{ validate: validateCancerSubtype }}
              render={({ field }) => (
                <CancerSubtypeAutocomplete
                  field={field}
                  cancerSubtypes={state.cancerSubtype}
                  subtypeIsValid={validateCancerSubtype}
                />
              )}
            />
          </Grid>

          <Grid item xs={8} lg={fullWidth ? 8 : 4} xl={fullWidth ? 8 : 2}>
            <Controller
              name="stage"
              defaultValue={null}
              control={control}
              rules={{ validate: validateStage }}
              render={({ field }) => (
                <CancerStageAutocomplete field={field} stages={state.stage} stageIsValid={validateStage} />
              )}
            />
          </Grid>

          <Grid item xs={8} xl={fullWidth ? 8 : 2}>
            <Controller
              name="ecogScore"
              defaultValue={null}
              control={control}
              render={({ field }) => <ECOGScoreAutocomplete field={field} ecogScores={state.ecogScore} />}
            />
          </Grid>

          <Grid item xs={8} xl={fullWidth ? 8 : 2}>
            <Controller
              name="karnofskyScore"
              defaultValue={null}
              control={control}
              render={({ field }) => (
                <KarnofskyScoreAutocomplete field={field} karnofskyScores={state.karnofskyScore} />
              )}
            />
          </Grid>

          <Grid item xs={8}>
            <Controller
              name="metastasis"
              defaultValue={[]}
              control={control}
              render={({ field }) => <MetastasisAutocomplete field={field} metastases={state.metastasis} />}
            />
          </Grid>

          <Grid item xs={8}>
            <Controller
              name="biomarkers"
              defaultValue={[]}
              control={control}
              render={({ field }) => <BiomarkersAutocomplete field={field} biomarkers={state.biomarkers} />}
            />
          </Grid>

          <Grid item xs={8}>
            <Controller
              name="radiation"
              defaultValue={[]}
              control={control}
              render={({ field }) => <RadiationAutocomplete field={field} radiations={state.radiation} />}
            />
          </Grid>

          <Grid item xs={8}>
            <Controller
              name="surgery"
              defaultValue={[]}
              control={control}
              render={({ field }) => <SurgeryAutocomplete field={field} surgeries={state.surgery} />}
            />
          </Grid>

          <Grid item xs={8}>
            <Controller
              name="medications"
              defaultValue={[]}
              control={control}
              render={({ field }) => <MedicationsAutocomplete field={field} medications={state.medications} />}
            />
          </Grid>

          <Grid item xs={8}>
            <Button
              sx={{
                float: 'right',
                fontSize: '1.3em',
                fontWeight: '500',
                minWidth: '200px',
                width: fullWidth || isSmallScreen ? '100%' : '25%',
              }}
              type="submit"
              variant="contained"
            >
              <SearchIcon sx={{ paddingRight: '5px' }} /> Search
            </Button>
          </Grid>
          <Grid item xs={8}>
            <Button
              onClick={handleSubmit(onDownload)}
              sx={{
                float: 'right',
                fontSize: '1.3em',
                fontWeight: '500',
                minWidth: '200px',
                width: fullWidth || isSmallScreen ? '100%' : '25%',
              }}
              variant="contained"
            >
              <DownloadIcon /> Download CSV
            </Button>
          </Grid>
        </Grid>
      </Box>
    </form>
  );
};

export default SearchForm;
