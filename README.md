# Forever Dental Care: Frontend

The website and admin dashboard for Forever Dental Care, built with React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, React Query 5, React Hook Form + Zod, Axios and Lucide icons.

The backend (Spring Boot API) lives in its own repository: https://github.com/syedcoder786/foreverdentalcare-backend

## Prerequisites

- **Node.js 20+** and npm
- A running backend (see the backend README), by default on http://localhost:8080

## Local setup

```bash
cp .env.example .env.local    # git-ignored
npm install
npm run dev                   # http://localhost:5173
```

Open **http://localhost:5173** for the website and **http://localhost:5173/admin** for the admin dashboard.

During development the Vite dev server proxies `/api` to `VITE_DEV_API_PROXY_TARGET` (default `http://localhost:8080`). The browser therefore sees a single origin, and the refresh-token cookie works with `SameSite=Strict`.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API. Leave empty to call `/api` on the same origin (Vite proxy locally, reverse proxy in production). |
| `VITE_DEV_API_PROXY_TARGET` | Where `npm run dev` proxies `/api`. |
| `VITE_CURRENCY` / `VITE_LOCALE` | Currency (ISO 4217) and locale used to format fees. |

`VITE_*` values are baked in at **build time**, so set them in your hosting provider before building.

## Tests and build

```bash
npm test         # 47 tests: validation, components, multi-doctor booking flow, theme, API error handling
npm run build    # type-check + production build into dist/
```

## Deployment

### Vercel (current setup)

The backend runs on Oracle Cloud (`http://137.23.54.124`). `vercel.json` forwards every `/api/*` request to it, server side, and sends all other paths to `index.html` (SPA routing):

| Where the site runs | `/api/...` goes to |
|---|---|
| `localhost` (`npm run dev` / `npm run preview`) | local backend via the Vite proxy (`VITE_DEV_API_PROXY_TARGET`, default `http://localhost:8080`) |
| Vercel | Oracle backend via the `vercel.json` rewrite |

The browser therefore only talks HTTPS to the Vercel domain: no mixed-content blocking (the backend is plain HTTP), no CORS, and the `SameSite=Strict` refresh cookie keeps working.

1. Import the `foreverdentalcare-frontend` repo in Vercel (framework: Vite; build and output settings come from `vercel.json`).
2. Environment variables: leave `VITE_API_BASE_URL` **unset**. Optionally set `VITE_CURRENCY` / `VITE_LOCALE`.
3. If the backend's address changes, update the destination in `vercel.json`.

### Other hosts

Serve `dist/` as static files with an SPA fallback (unknown paths return `index.html`).

- **Same domain as the API** (recommended): put a reverse proxy in front so `/api/*` goes to the backend, and leave `VITE_API_BASE_URL` empty.
- **API on a different subdomain** (for example `api.clinic.example.com`): set `VITE_API_BASE_URL` at build time, and add the frontend origin to the backend's `CORS_ALLOWED_ORIGINS`. Keep both on the same registrable domain so the `SameSite=Strict` refresh cookie still works.

## Project structure

```
foreverdentalcare-frontend/
  src/
    components/   ui/ (Button, inputs, Modal, DataTable, Alert, Spinner...), layout/, services/,
                  appointment/ (AppointmentForm, SlotPicker), admin/ (Sidebar, StatCard, modals)
    pages/        Home, About, Services, Contact, BookAppointment, admin/*
    layouts/      PublicLayout, AdminLayout
    hooks/        React Query hooks for public and admin data
    services/     axios client (token + refresh handling), API modules
    context/      AuthContext
    config/       fallbacks.ts: minimal values used only if the API is unreachable (all content is in the database)
    types/ utils/ test/
```
