# LLHelper

Maharashtra IGR Leave & License helper. V1 prioritizes a Chrome/Edge extension, server-side typeahead, and assisted form fill. No local database service or offline-first mode.

## Current status

This repository is being built in small, reviewable steps. The API foundation includes a health route and a fail-closed authentication placeholder. **Party/property search and writes are not enabled yet** because server-side Neon Auth session verification and a least-privilege database role must be completed first.

## Local development

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure server-only values.
4. Run `npm run dev`.

`GET /api/v1/health` is a liveness check and does not prove database or authentication readiness.

## Security requirements

- Never put database credentials or privileged secrets in extension/browser code.
- Do not deploy using the Neon `neondb_owner` role. Provision a dedicated runtime role with only required table/sequence/function permissions, no ownership, no RLS bypass, and no access to `public.schema_migrations`.
- Validate Neon Auth sessions server-side. Never trust user IDs supplied in request data or headers.
- Set `app.user_id` transaction-locally from the verified session within the same transaction as tenant queries.
- Fail closed if authentication or database tenant context is unavailable.
- Never automate CAPTCHA, OTP, eKYC, biometrics, payment, or final IGR submission.

See [the API contract](docs/api-contract.md) for endpoint and data behavior requirements.