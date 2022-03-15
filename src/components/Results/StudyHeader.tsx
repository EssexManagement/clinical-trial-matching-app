import { ReactElement } from 'react';
import {
  AccordionActions,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationOnIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import TargetIcon from './TargetIcon';
import UnsaveIcon from './UnsaveIcon';
import BookmarkCheckIcon from './BookmarkCheckIcon';

import { StudyDetailProps, SaveStudyHandler } from './types';
import StudyDetailsButton from './StudyDetailsButton';

type StudyHeaderProps = {
  isExpanded: boolean;
  study: StudyDetailProps;
  handleSaveStudy: SaveStudyHandler;
  isStudySaved: boolean;
};

const StudyHeader = ({ isExpanded, study, handleSaveStudy, isStudySaved }: StudyHeaderProps): ReactElement => {
  const studyTags = [...study.conditions, study.phase, study.type];
  const theme = useTheme();
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const closestFacilityDistance = study?.closestFacilities?.[0]?.distance;

  return (
    <AccordionSummary
      aria-controls={`results-content-${study.trialId}`}
      expandIcon={
        <IconButton aria-label="expand collapse">
          <ExpandMoreIcon fontSize="large" sx={{ color: isExpanded ? 'common.white' : 'common.gray', mx: 0 }} />
        </IconButton>
      }
      id={`results-header-${study.trialId}`}
      sx={{
        backgroundColor: isExpanded ? 'common.gray' : 'common.grayLighter',
        color: isExpanded ? 'common.white' : 'common.gray',
        p: 0,
        '&.MuiAccordionSummary-root': { flexDirection: { xs: 'column', sm: 'row' } },
        '& .MuiAccordionSummary-content': { m: 0, flexDirection: { xs: 'column', sm: 'row' } },
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} flexGrow={1} spacing={{ xs: 0, lg: 4 }}>
        <Box
          alignItems="center"
          bgcolor={study.status.color}
          display={{ xs: 'block', lg: 'flex' }}
          height="100%"
          justifyContent="center"
          minHeight={{ lg: '100px' }}
          minWidth="110px"
          p={1}
          width={{ xs: 'fit-content', lg: '110px' }}
        >
          <Typography color="common.white" fontWeight="600" sx={{ textTransform: 'uppercase' }} textAlign="center">
            {study.status.text}
          </Typography>
        </Box>

        <Stack
          alignItems="center"
          direction={{ xs: 'column', xl: 'row' }}
          flexGrow={1}
          height="100%"
          p={2}
          spacing={{ xs: 0, xl: 4 }}
        >
          <Stack alignSelf={{ xs: 'flex-start', xl: 'center' }} flex={{ xl: '8 4' }}>
            <Typography fontWeight="normal" lineHeight={1.2} mb={0.5} variant="h6">
              {study.title}
            </Typography>

            <Stack alignItems="center" direction="row" flexWrap="wrap">
              {studyTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  sx={{
                    backgroundColor: isExpanded ? 'common.white' : 'common.grayLight',
                    color: isExpanded ? 'common.gray' : 'common.grayLighter',
                    fontWeight: '600',
                    marginRight: 1,
                    marginTop: 0.5,
                    textTransform: 'uppercase',
                  }}
                  size="small"
                />
              ))}
            </Stack>
          </Stack>

          <Stack alignSelf={{ xs: 'flex-start', xl: 'center' }} py={1} spacing={{ xs: 0, xl: 0.5 }} flex={{ xl: 1 }}>
            <Stack alignItems="center" direction="row" spacing={1}>
              <TargetIcon fontSize="inherit" sx={{ color: study.likelihood.color, width: '20px' }} />
              <Typography whiteSpace="nowrap">{study.likelihood.text}</Typography>
            </Stack>

            {closestFacilityDistance && (
              <Stack alignItems="center" direction="row" spacing={1}>
                <LocationOnIcon fontSize="small" sx={{ color: isExpanded ? 'common.white' : 'common.gray' }} />
                <Typography>{closestFacilityDistance}</Typography>
              </Stack>
            )}

            {study.period && (
              <Stack alignItems="center" direction="row" spacing={1}>
                <EventIcon fontSize="small" sx={{ color: isExpanded ? 'common.white' : 'common.gray' }} />
                <Typography>{study.period}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>

      <AccordionActions style={{ padding: ' 0 16px' }}>
        {isExtraSmallScreen ? (
          <StudyDetailsButton
            icon={isStudySaved ? <UnsaveIcon /> : <SaveIcon />}
            text={isStudySaved ? 'Unsave study' : 'Save study'}
            onClick={handleSaveStudy}
          />
        ) : (
          <IconButton aria-label={isStudySaved ? 'unsave study' : 'save study'} onClick={handleSaveStudy}>
            {isStudySaved ? (
              <UnsaveIcon fontSize="medium" sx={{ color: isExpanded ? 'common.blueLighter' : 'common.blue', p: 0 }} />
            ) : (
              <SaveIcon fontSize="medium" sx={{ color: isExpanded ? 'common.blueLighter' : 'common.blue', p: 0 }} />
            )}
          </IconButton>
        )}
      </AccordionActions>

      {isStudySaved && (
        <BookmarkCheckIcon
          fontSize="medium"
          sx={{
            color: isExpanded ? 'common.blueLighter' : 'common.blue',
            p: 0,
            position: 'absolute',
            right: '0.5em',
          }}
        />
      )}
    </AccordionSummary>
  );
};

export default StudyHeader;
