## Seva Eats Backend, Auth, and Realtime Implementation Plan

### Goals
- Support recipient app and separate driver app from day one.
- Keep provider choice open until short proof-of-concepts are complete.
- Use server-authoritative request lifecycle and tracking state.
- Ship OAuth and email-based authentication with a clean migration from fake auth.

### Scope
- Included: backend contracts, schema, realtime event model, auth model, rollout order.
- Excluded: payment subscriptions, production OAuth credential setup, driver UI implementation.

### Recommended Decision Process
1. Keep code provider-agnostic at interface level now.
2. Run two small PoCs before final vendor lock:
   - PoC A: create request, assign driver, stream location updates.
   - PoC B: Google, Apple, and Email sign-in session creation.
3. Choose provider using acceptance criteria:
   - End-to-end latency under 2 seconds for active tracking updates.
   - Secure per-user data isolation.
   - Straightforward Expo integration.
   - Predictable cost at projected usage.

### Provider Comparison
- Supabase:
  - Strengths: PostgreSQL, realtime channels, row-level security, fast Expo integration.
  - Trade-offs: requires careful RLS policy design.
- Firebase:
  - Strengths: mature auth, strong realtime listeners, large ecosystem.
  - Trade-offs: document model can be less ergonomic for relational matching logic.
- AWS (Cognito + AppSync + DynamoDB/RDS):
  - Strengths: high scalability and flexibility.
  - Trade-offs: highest implementation complexity and longer setup time.

### Architecture (Provider-Agnostic)
- Recipient app:
  - Submits requests.
  - Subscribes to request status and active driver location.
- Driver app:
  - Accepts request assignments.
  - Pushes status transitions and location pings.
- Backend services:
  - Auth service.
  - Request orchestration service.
  - Realtime event service.
  - Notification service.

### Auth Model
- Supported providers:
  - Google OAuth
  - Apple Sign in with Apple
  - Email magic link or OTP
- Internal identity model:
  - Stable internal user id independent of external provider ids.
  - Linked identities table for multi-provider account linking.
- Session model:
  - Short-lived access token.
  - Refresh token rotation.
  - Device metadata for revocation and audit.

### Data Schema v1

#### users
- id (uuid, pk)
- role (enum: recipient, driver, admin)
- display_name
- phone
- email
- created_at
- updated_at

#### identities
- id (uuid, pk)
- user_id (fk -> users.id)
- provider (enum: google, apple, email)
- provider_subject
- created_at
- unique(provider, provider_subject)

#### sessions
- id (uuid, pk)
- user_id (fk -> users.id)
- refresh_token_hash
- device_label
- expires_at
- created_at
- revoked_at

#### locations
- id (uuid, pk)
- name
- type (enum: hub, dropoff)
- address
- latitude
- longitude
- created_at

#### requests
- id (uuid, pk)
- recipient_user_id (fk -> users.id)
- pickup_location_id (fk -> locations.id)
- delivery_address
- delivery_latitude
- delivery_longitude
- serving_size
- dietary_restrictions (json/text[])
- driver_note
- status (enum: pending, matched, picked_up, on_the_way, delivered, cancelled)
- estimated_delivery_at
- created_at
- updated_at

#### driver_assignments
- id (uuid, pk)
- request_id (fk -> requests.id)
- driver_user_id (fk -> users.id)
- assigned_at
- accepted_at
- unassigned_at
- active (boolean)

#### request_status_history
- id (uuid, pk)
- request_id (fk -> requests.id)
- status
- actor_user_id (fk -> users.id)
- reason
- created_at

#### driver_location_pings
- id (uuid, pk)
- driver_user_id (fk -> users.id)
- request_id (fk -> requests.id, nullable)
- latitude
- longitude
- accuracy_meters
- heading
- speed_mps
- recorded_at

#### push_tokens
- id (uuid, pk)
- user_id (fk -> users.id)
- platform (enum: ios, android, web)
- token
- created_at
- revoked_at

#### notifications
- id (uuid, pk)
- user_id (fk -> users.id)
- request_id (fk -> requests.id, nullable)
- type
- payload (json)
- sent_at
- opened_at

### Status Transition Rules
- Allowed transitions:
  - pending -> matched
  - matched -> picked_up
  - picked_up -> on_the_way
  - on_the_way -> delivered
  - pending -> cancelled
  - matched -> cancelled
- Server enforces transitions.
- Client attempts invalid transitions should receive 409 conflict.

### Realtime Contracts
- Channel: request:{requestId}
  - events: request.status.updated, driver.location.updated, eta.updated
- Channel: driver:{driverId}
  - events: assignment.created, assignment.cancelled
- Delivery guarantees:
  - At-least-once event delivery.
  - Idempotent handling using event id and timestamp.

### API Contracts (Initial)
- POST /auth/sign-in/google
- POST /auth/sign-in/apple
- POST /auth/sign-in/email
- POST /auth/refresh
- POST /auth/sign-out
- POST /requests
- GET /requests
- GET /requests/{id}
- PATCH /requests/{id}/cancel
- PATCH /driver/requests/{id}/accept
- PATCH /driver/requests/{id}/status
- POST /driver/location

### Security Controls
- Never trust client status or role claims without server validation.
- Enforce per-user access control on all request reads/writes.
- Store only hashed refresh tokens.
- Require auth on realtime subscription channels.
- Apply rate limits on auth and location ping endpoints.

### Rollout Plan
1. Keep current fake auth UI in app, but route through auth adapter interface.
2. Implement backend schema and auth endpoints in staging.
3. Replace fake auth adapter with real provider adapters.
4. Migrate request persistence from AsyncStorage to backend sync.
5. Enable realtime tracking in recipient app and driver app.
6. Run soak test with simulated drivers before production.

### Migration Notes from Current App
- Current local keys:
  - onboarding-completed
  - auth-completed
  - user-profile
  - meal-requests
- Migration strategy:
  - On first authenticated launch, upload unsynced local requests.
  - Mark local records as migrated with server ids.
  - Keep rollback path: local read fallback if backend is unavailable.
