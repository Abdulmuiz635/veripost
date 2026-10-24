# VeriPost

Instant, auditable address verification for Nigerian banks and fintechs, built on the NIPOST national digital postcode.

VeriPost confirms that an address is real, then binds it to the customer, and returns a signed verification record in seconds. It replaces the physical agent visit that costs banks roughly 1,500 to 3,500 naira and takes three to seven days per customer.

Status: working prototype. Runs end to end locally. Built for the Built on Nigeria's Postcode showcase (Federal Ministry of Communications, Innovation and Digital Economy, and NIPOST).

---

## The problem

Nigerian banks and fintechs must verify a customer's residential address for Tier 3 KYC, loan approvals, and higher transaction limits. Today they send a physical agent to the house, then fall back on a paper utility bill that is easy to fake, and many streets are unnumbered or hard to find. The result is slow onboarding, high drop-off, real cost on every account, and weak protection against address fraud.

A valid postcode on its own proves nothing, because anyone can enter a real code. Confirming that an address exists is not the same as confirming it belongs to the customer. That gap is what VeriPost closes.

## How it works

1. The customer enters their 11 character NIPOST postcode during onboarding.
2. VeriPost checks validity and resolves the official state and LGA from the live NIPOST reference data, plus the house address.
3. VeriPost reverse-geocodes the customer's live location and compares the nearest real postcode to the one they claimed. This binds the address to the person.
4. A confidence score is produced, and a signed Verified Address Record is returned with a full audit log.

### Outcomes

The result is a graded status, not a blunt yes or no, so a customer who is simply away from home is reviewed rather than rejected.

| Status | Meaning |
| --- | --- |
| Verified | Live location matches the claimed postcode. Safe to proceed. |
| Flagged | Partial signal. Route to step-up review, or reconfirm on a later session. |
| Unverified | Location does not support the claimed address. |
| Rejected | Postcode is not valid in the NIPOST registry. |

### Score

Validity is a gate. The confidence score measures how strongly the live location supports the claim, out of 100:

- Location match depth, 0 to 50 (state down to building unit)
- Distance to the nearest real unit, 0 to 25
- NIPOST confidence grade, 0 to 25
- Repeat presence confirmations, 0 to 20

Verified at 75 and above, Flagged at 40 and above, otherwise Unverified. Repeated confirmations at the registered address lift a Flagged customer to Verified over time.

## Platform

Two apps.

- **Backend**, an Express and TypeScript API with Prisma. It talks to the NIPOST API, runs the scoring, signs records, serves the bank-facing and admin endpoints, and writes the audit log.
- **Frontend**, a Next.js app. A landing page, an interactive bank onboarding demo, and a developer dashboard with live logs and analytics. API keys stay server side behind Next route handlers.

### NIPOST provider modes

The backend speaks to NIPOST through one interface with three modes, set by `NIPOST_MODE`:

- `live` uses the NIPOST API for everything. Needs an access level grant for L2 addresses and L5 coordinates.
- `hybrid` uses the live NIPOST reference endpoints for real state and LGA validation and naming, with fixtures for building resolution and reverse geocode. This is what a test or L1 key can do today, and it is the default when a key is present.
- `mock` uses built-in fixtures only, no network. Useful for offline development.

The hybrid mode is resilient. If a live call fails it falls back to fixture names, so the demo never breaks.

### Data model

- `Client` and `ApiKey`, where keys are stored only as sha256 hashes.
- `Verification`, the record of each check, including the score, status, resolved address, and the signed record id.
- `PresenceEvent`, each confirming location reading tied to a pseudonymous customer reference.

## Features

- Postcode autocomplete backed by the NIPOST Search tool.
- Validity and address resolution, with live state and LGA names from NIPOST reference data.
- Location binding through reverse geocode, with a graded confidence score.
- Reconfirmation flow that lifts a Flagged customer to Verified across sessions.
- Signed Verified Address Record as a JWT, verifiable offline.
- Developer dashboard: outcome breakdown, 14 day activity, filterable and searchable logs, and a detail drawer with a presence timeline.
- Client API key management with hashed storage and revocation.

## API reference

Base URL `http://localhost:8080`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/v1/verify` | `X-Client-Key` | Verify a postcode and bind it to a customer |
| POST | `/v1/reconfirm` | `X-Client-Key` | Add a later presence reading, lift status over time |
| GET | `/v1/search/autocomplete?q=` | `X-Client-Key` | Postcode type-ahead |
| POST | `/v1/records/verify` | none | Validate a signed Verified Address Record |
| GET | `/v1/demo/buildings` | none | Sandbox buildings for the demo location toggle |
| GET | `/health` | none | Service and NIPOST connectivity status |
| GET | `/admin/stats` | `X-Admin-Token` | Dashboard analytics |
| GET | `/admin/verifications` | `X-Admin-Token` | List verifications, filter by status or query |
| GET | `/admin/verifications/:id` | `X-Admin-Token` | Single verification with presence events |
| GET | `/admin/clients` | `X-Admin-Token` | List clients and active keys |
| POST | `/admin/clients` | `X-Admin-Token` | Create a client |
| POST | `/admin/clients/:id/keys` | `X-Admin-Token` | Issue a client key, returned once |
| DELETE | `/admin/keys/:id` | `X-Admin-Token` | Revoke a key |

Example verify request:

```bash
curl -X POST http://localhost:8080/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-Client-Key: <client key>" \
  -d '{"postcode":"LA-11-B14-IK-07","customer_ref":"cust_123","location":{"lat":6.6018,"lng":3.3515}}'
```

## Running locally

### Prerequisites

- Node.js 20 or newer.
- No database server needed. Local development uses SQLite, a single file at `backend/prisma/dev.db`.

### Backend

```bash
cd backend
cp .env.example .env               # then set your NIPOST_API_KEY and secrets
npm install
npm run prisma:push                # creates the SQLite database
npm run db:seed                    # demo client, a demo key, and sample rows
npm run dev                        # http://localhost:8080
```

The seed prints a demo client key. Set it as `DEMO_CLIENT_KEY` in the frontend env.

### Frontend

```bash
cd frontend
cp .env.example .env.local         # set DEMO_CLIENT_KEY and ADMIN_API_TOKEN to match the backend
npm install
npm run dev                        # http://localhost:3000
```

### Use it

- `http://localhost:3000` landing page
- `http://localhost:3000/demo` bank onboarding demo. Try `LA-11-B14-IK-07`. The location buttons simulate the device GPS so you can show each outcome.
- `http://localhost:3000/dashboard` live logs and analytics

### Going live on the NIPOST API

Once NIPOST grants an access level, in `backend/.env` set `NIPOST_MODE=live` and `NIPOST_API_KEY`, then restart the backend. For production, change the Prisma datasource provider to `postgresql` and point `DATABASE_URL` at Postgres. No code changes are needed.

## Project structure

```
veripost/
  backend/
    prisma/            schema and seed
    src/
      lib/             nipost client, scoring, postcode parsing, record signing, keys
      middleware/      auth and error handling
      routes/          verify, reconfirm, search, admin, health
      server.ts
  frontend/
    app/               landing, demo, dashboard, and api proxy routes
    components/        logo, charts, score meter, postcode input, ui
    lib/               types, formatting, backend client
```

## Tech stack

- Backend: Node.js, TypeScript, Express, Prisma, SQLite for development and Postgres for production, jsonwebtoken, zod.
- Frontend: Next.js, React, Tailwind CSS. Hand-built SVG charts, no chart library.
- Fonts: Space Grotesk, Inter, and JetBrains Mono for postcodes and data.

## Data and compliance

- No real identity is stored. Customers are a pseudonymous reference.
- Client API keys are stored only as hashes. The raw key is shown once.
- Demo data is sandbox only, which keeps the demo within the Nigeria Data Protection Act requirement to use test data.
- Consent for a location read is captured before the reading.
