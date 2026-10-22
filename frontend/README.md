# Doctor Tracker · Frontend

The Next.js client for Doctor Tracker: landing page, sign-in, dashboard, doctors and patients. It talks to the separate [backend API](../backend) over REST.

**Live:** https://doctor-tracker-psi.vercel.app (demo accounts are listed in the [main README](../README.md#links))

Architecture, technical decisions, query plans and screenshots are in the [main README](../README.md).

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · TanStack Query 5 · Tailwind CSS 4 · Recharts 3 · React Hook Form + Zod · lucide icons

## Run locally

The API must be running first (see [backend/README.md](../backend/README.md)).

```bash
cp .env.example .env.local   # set JWT_SECRET to the same value as backend/.env
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `API_URL` | Where `/api/*` is proxied (default `http://localhost:4000`) |
| `JWT_SECRET` | Verifies the session cookie in `src/proxy.ts`; must match the API's secret |
| `SESSION_COOKIE_NAME` | Optional; must match the API's `COOKIE_NAME` (default `dt_session`) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and start |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route type generation and `tsc` |

## Structure

```text
src/
├── proxy.ts        # redirects signed-out users to /login before a page renders
├── app/            # routes: / (landing), login, (app)/dashboard, doctors, doctors/[id], patients
├── features/       # per feature: data hooks (api.ts), types and components
│   └── auth/  dashboard/  doctors/  patients/
├── components/     # ui, filters, charts and layout building blocks
├── hooks/          # URL state, debounce, hydration
├── lib/            # API client, query client and keys, constants, utils
└── assets/         # product screenshots used on the landing page
```

The browser never calls the API's origin directly: Next.js rewrites `/api/*` to `API_URL`, so the httpOnly session cookie stays first-party and no CORS setup is needed.
