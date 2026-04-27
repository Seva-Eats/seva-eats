## Migration Runbook: Local Storage to Backend

### Objective
Migrate recipient data safely from local device storage to backend-backed persistence with minimal user disruption.

### Local Keys in Current App
- onboarding-completed
- auth-completed
- user-profile
- meal-requests

### Preconditions
1. Backend staging environment is ready.
2. Auth endpoints and request endpoints are deployed.
3. App includes migration marker key: migration-v1-complete.

### Migration Steps
1. On first launch after update, check migration-v1-complete.
2. If not migrated:
   - Read user-profile and meal-requests from local storage.
   - Require sign-in if user is not authenticated.
   - Create or upsert user profile on backend.
   - Upload local requests with idempotency keys.
   - Map local request ids to server request ids.
3. Write migration-v1-complete=true only after all uploads succeed.
4. Keep local copy for one version as rollback fallback.

### Conflict Handling
- If a request already exists on backend:
  - Compare status timestamp and keep newest authoritative record.
- If upload fails midway:
  - Retry only failed records using idempotency keys.

### Rollback Plan
- If backend fails consistently:
  - Continue rendering local data.
  - Queue background retries.
  - Show non-blocking banner indicating sync delay.

### Verification Checklist
1. Fresh user can sign in and create request with backend persistence.
2. Existing local user sees historical requests after migration.
3. No duplicate requests after repeated retries.
4. Sign-out does not delete server-side history.
5. Reinstall flow works and historical requests return after sign-in.
