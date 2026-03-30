# Why their 500 looks different from mine

1. Their web.config
2. The client might have global IIS settings that override the application's behavior:

   - Check: IIS Manager → Server/Site → Error Pages → Edit Feature Settings.

     If set to "Custom error pages" with "Replace", it overrides all apps

     ```ps
     Get-WebConfiguration -Filter system.webServer/httpErrors -PSPath "IIS:\Sites\CTMS"
     ```

# Why the Condition resource is returning 400

> Enabling FHIR Debug logging with DEBUG='FHIR.\*' doesn't seem to add any additional logging insight for this issue.

1. Stale/Invalid Session Data

The session contains references to Conditions that no longer exist or the patient record has changed since the session was created.

2. Referenced Condition Was Deleted

Something in the patient's record references a Condition that was deleted from Epic.

3. Permission/Access Issue

The session doesn't have permission to access that specific Condition record, even though it's associated with the patient.

4. Epic-Specific Query Issue

Check if `FHIR_QUERY_CONDITION` environment variable is adding filters that conflict with Epic's session-based querying.

To Diagnose:

Check what query parameters are being sent:

```ts
// Add logging in fetchBundles before line 40:
console.log(`Fetching ${resourceType} with params:`, parameters);
console.log(`Full URL: ${resourceType}?patient=${fhirClient.getPatientId()}${extra}`);
```

# Update:

Commit 519c0d08329b51f0a2373f8928ab0b402cc2bfbb seemed to resolve the issue - although it's not a permanent fix. The best longterm strategy would be to determine how much of the patient's history to consider or to apply filtering logic.
