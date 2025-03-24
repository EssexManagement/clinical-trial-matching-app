#!/bin/bash

set -x

# This script exists pretty much solely to pass off to the "real" test script
# But it makes running it on Windows easier
# Define default values
PROTOCOL="http"
HOSTNAME="localhost"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --wrappers)
      wrappers="$2"
      shift 2
      ;;
    --protocol)
      PROTOCOL="$2"
      shift 2
      ;;
    --hostname)
      HOSTNAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

node clinical-trial-matching-app/scripts/test.js --protocol $PROTOCOL --hostname $HOSTNAME --wrappers $wrappers
