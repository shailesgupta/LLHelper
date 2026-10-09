# LLHelper API Contract (V1)

Status: design baseline; endpoints are not implemented yet.

## Product constraints
- Chrome/Edge extension first; web app follows after the API stabilizes.
- No offline requirement and no separate local database service.
- Optimize typeahead latency. The server database is the source of truth.
- Never submit IGR forms automatically. The extension fills blank fields only; the user reviews and saves.
- Never automate CAPTCHA, OTP, eKYC, biometrics, payment, or final submission.
- Do not automate or fill Tab B Furniture & Appliances.
- Do not persist party roles (licensor/licensee/witness) on a reusable party record.

## Authentication and trust boundary
1. The extension signs in using the approved Neon Auth browser flow and sends a short-lived session credential over HTTPS.
2. Every API request validates the session server-side. A user ID in request JSON, query parameters, or headers is never an identity assertion.
3. Backend derives the authenticated Neon Auth user UUID from the verified session, then uses it for all database operations.
4. Database credentials and privileged keys exist only in server-side environment variables; never in extension source, web bundles, or responses.
5. Use a restricted runtime database role. Migration/owner credentials are not used by the API.
6. For each transaction, backend sets transaction-local app.user_id from the verified session (for example, set_config('app.user_id', $1, true)). Never accept this value from the client. RLS is defense in depth, not a replacement for API authorization.
7. If there is no authenticated user context, queries must see no user-owned rows and writes must fail.
8. Rate-limit auth, search, and write endpoints; validate payloads; cap request and result sizes; use TLS; redact personal data and tokens from logs.

## API conventions
- Prefix: /api/v1
- JSON request/response bodies; UTF-8.
- UUID identifiers.
- Standard errors: { "error": { "code": "stable_code", "message": "Safe user-facing message", "requestId": "..." } }
- Never return PAN/Aadhaar values in generic logs or analytics.
- Search responses should include only fields needed to disambiguate and fill the current IGR tab.
- Initial result cap: 10; explicit pagination for management screens.
- Normalize query whitespace/case server-side. Exact PAN/Aadhaar/mobile matches rank before normalized name prefixes and tags. Fuzzy matches are secondary and must never auto-select a record.

## Proposed endpoints
### Session
- GET /api/v1/me — return authenticated profile basics and account status.
- POST /api/v1/devices/register — register a browser extension device; server generates/rotates device credentials if required. Store only a hash of long-lived device secrets.
- DELETE /api/v1/devices/{deviceId} — revoke one of the current user's devices.

### Typeahead (latency-critical)
- GET /api/v1/search/parties?q=... — search the current user's active party records by exact identifiers, normalized name prefix, mobile, and tags.
- GET /api/v1/search/properties?q=... — search the current user's active properties by tags, building/unit, address, and location identifiers.
- Search is read-only, bounded, indexed, and scoped to the authenticated user. Do not search other users' records. Avoid returning full Aadhaar/PAN unless a later, specifically authorized use case requires it.

### Records
- GET /api/v1/parties/{id}
- POST /api/v1/parties
- PATCH /api/v1/parties/{id}
- DELETE /api/v1/parties/{id} — soft delete.
- GET /api/v1/properties/{id}
- POST /api/v1/properties
- PATCH /api/v1/properties/{id}
- DELETE /api/v1/properties/{id} — soft delete.
- GET /api/v1/tags?entityType=party|property&entityId=...
- PUT /api/v1/tags — add/update a tag with ownership verified by the server.

### Sync
No offline-first sync is required for V1. The API can provide direct read/write operations with server-side persistence and optimistic concurrency via record_version. Add a sync protocol only if cross-device freshness requires it; never trust client-supplied ownership or version alone.

## Write and duplicate rules
- Require an expected record_version for updates; return 409 conflict on mismatch.
- Duplicate PAN/Aadhaar checks are scoped to the authenticated user. A duplicate returns a conflict requiring explicit user review; never silently overwrite.
- Blank incoming fields never erase existing populated values unless the user explicitly requests clearing a field.
- Soft-deleted records are excluded from normal search. Reuse/restore requires explicit confirmation.
- Party records are role-neutral. Do not store licensor/licensee/witness role in party data.
- Property tag generation belongs in application logic: DFP_262 + one space + DBD_262, trimmed; regenerate when those fields change while preserving user-edited/manual tags.

## Typeahead performance goals
- Target p95 API response under 200 ms for indexed searches in the normal deployment region (measure before claiming).
- Return at most 10 suggestions per query.
- Debounce client keystrokes by about 150 ms and cancel stale in-flight searches.
- Add indexes for normalized name, mobile, normalized tags, and property lookup fields based on query plans.
- Keep payloads small; don't fetch full record details until a suggestion is selected.
- No client-side cache is required initially. If a short in-memory cache is later added, expire it quickly and clear it on sign-out.

## Important database follow-up
The initial schema has RLS policies based on public.llhelper_current_user_id(), which reads app.user_id. The API must set this transaction-locally from a verified session. Also ensure the runtime role cannot access public.schema_migrations, and does not own tables or bypass RLS. The migration role and runtime role must be separate.

## V1 acceptance checks
- Unauthenticated requests receive 401.
- User A cannot read, search, modify, or delete User B's records even when User B's UUIDs are supplied.
- Missing transaction-local user context exposes no user data.
- Device revocation prevents that device credential from being used.
- Typeahead returns bounded results in deterministic relevance order.
- Duplicate PAN/Aadhaar prompts for explicit review; no silent overwrite.
- Existing populated fields are not erased by blank incoming values.
- API logs contain no credentials, OTPs, full Aadhaar, or full PAN.
- Extension never clicks Save/Add/submit/payment or controls CAPTCHA/OTP/eKYC/biometrics.