If the query to the matching service included the location in the request, flagged by: `sendLocationData`, then the search is assumed to return only results that are within range.

If the study entry does not include `closestFacilities`, then the distance quantity (value) will default to 0, meaning that the study will always be considered within range of the provided `travelDistance` search filter.
