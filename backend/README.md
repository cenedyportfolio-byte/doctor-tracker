# Doctor Tracker · Backend API

The standalone Express REST API for Doctor Tracker. It owns all data access and business rules over MongoDB; the [frontend](../frontend) is a separate client.

**Live:** https://doctor-tracker-api-indol.vercel.app/health · REST base path `/api/v1`

Architecture, the full API reference, index list and query plans are in the [main README](../README.md).

## Stack

Express 5 · TypeScript · Mongoose 9 / MongoDB · Zod 4 · jose (JWT) · bcrypt · helmet · express-rate-limit · Vitest + Supertest

## Run locally

Needs MongoDB 6+. From the repository root, `docker compose up -d mongo` starts one on `localhost:27017`.

```bash
cp .env.example .env   # set JWT_SECRET (openssl rand -base64 48), and MONGODB_URI if needed
npm install
npm run seed           # 2 demo users, 48 doctors, 1,800 patients
npm run dev            # http://localhost:4000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with reload |
| `npm run build && npm start` | Production build and start |
| `npm run seed` | Resets the database to the demo dataset |
| `npm test` | Integration tests against a real MongoDB (`MONGODB_URI_TEST`) |
| `npm run explain` | Prints the query plan of every hot query |
| `npm run db:sync-indexes` | Builds missing indexes and drops obsolete ones |
| `npm run typecheck` | `tsc` |

## Endpoints

All routes are under `/api/v1`. Everything except `/auth/*` needs a session cookie, and every non-GET request needs the `admin` role.

| Area | Routes |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` |
| Doctors | `GET/POST /doctors` · `GET /doctors/facets` · `GET /doctors/options` · `GET/PATCH/DELETE /doctors/:id` |
| A doctor's patients | `GET/POST /doctors/:id/patients` · `DELETE /doctors/:id/patients/:patientId` |
| Patients | `GET/POST /patients` · `GET/PATCH/DELETE /patients/:id` |
| Dashboard | `GET /stats/overview?range=7d\|30d\|90d` |

`GET /health` (outside `/api/v1`) reports liveness and database connectivity.

## Structure

```text
server.js          # Vercel entry: imports the compiled app from dist/
src/
├── index.ts       # local and Docker entry, graceful shutdown
├── app.ts         # Express app: middleware and routers
├── config/        # env validation, database connection, domain constants
├── lib/           # errors, validation, search, pagination, cache
├── middleware/    # authenticate, requireAdminForWrites, error handling
├── modules/       # auth, users, doctors, patients, stats: model · schema · service · controller · routes
└── scripts/       # seed, explain-queries, sync-indexes
tests/             # Vitest + Supertest
```
