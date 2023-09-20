// Transpile modules so that they support IE11. There does not appear to be a
// way to say "transpile everything."
const withTM = require('next-transpile-modules')([
  '@emotion/react',
  '@mui/base',
  '@mui/material',
  '@mui/private-theming',
  '@mui/styled-engine',
  '@mui/system',
  '@mui/utils',
  'csv-stringify',
  'react-hook-form',
]);
module.exports = withTM({
  watch: true, // Enable watch mode
  poweredByHeader: false,
  reactStrictMode: true,
  publicRuntimeConfig: {
    fhirClientId: process.env.FHIR_CLIENT_ID,
    fhirRedirectUri: process.env.FHIR_REDIRECT_URI,
    defaultZipCode: process.env.DEFAULT_ZIP_CODE,
    defaultTravelDistance: process.env.DEFAULT_TRAVEL_DISTANCE,
    sendLocationData: JSON.parse(process.env.SEND_LOCATION_DATA ?? 'false'),
    reactAppDebug: JSON.parse(process.env.REACT_APP_DEBUG ?? 'false'),
    services: [
      {
        name: 'ancora',
        label: 'Ancora.ai',
        url: 'http://localhost',
        searchRoute: '/ancora.ai/getClinicalTrial',
      },
      {
        name: 'breastCancerTrials',
        label: 'BreastCancerTrials.org',
        url: 'http://localhost',
        searchRoute: '/breastcancertrials.org/getClinicalTrial',
        defaultValue: true,
      },
      {
        name: 'lungevity',
        label: 'LUNGevity',
        url: 'http://localhost',
        searchRoute: '/lungevity/getClinicalTrial',
      },
      {
        name: 'carebox',
        label: 'Carebox',
        url: 'http://localhost',
        searchRoute: '/carebox/getClinicalTrial',
      },
    ],
  },
  serverRuntimeConfig: {
    sessionSecretKey: process.env.SESSION_SECRET_KEY,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ loader: '@svgr/webpack', options: { icon: true } }],
    });
    // Disable minification (useful for debugging IE11).
    // Left commented out because it greatly bloats the script size.
    // config.optimization.minimize = false;

    return config;
  },
});
