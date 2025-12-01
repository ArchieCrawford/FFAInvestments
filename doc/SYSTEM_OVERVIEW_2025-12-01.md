# FFA Investments – System Snapshot & Rebuild Blueprint

_Last updated: 2025-12-01_

This document compresses everything another engineer or AI needs to understand, operate, and faithfully recreate the FFA Investments platform. It covers the product vision, architecture, directory map, navigation schema, data + integrations, environment expectations, and a runnable playbook from local dev to production.

---

## 1. Product Purpose & Roles
- **What it is**: A role-aware investment club portal where admins manage members, dues, and Schwab integrations, while members track portfolios, education, and contributions.
- **Personas**:
  - _Admins_: manage accounts, dues, education content, Schwab data, and club configuration.
  - _Members_: land on `MemberHome` (routed via `/member/accounts`) for portfolio snapshots, access dashboards, education, feeds, and contribution tools.
- **Guardrails**: `ProtectedRoute` enforces auth, `AuthContext` supplies `user/profile/isAdmin`. Members redirected away from `/admin/*` (see `src/Layout.jsx`).

---

## 2. Technology Stack Snapshot
- **Frontend**: React 18 + Vite 4, Tailwind-based theming, React Router 6, React Query, Lucide + FontAwesome icons.
- **State & Data**: Supabase JS client, TanStack Query for caching, custom hooks in `src/lib` & `src/hooks`.
- **Backend**: Express server in `backend/server.js` for Charles Schwab OAuth (auth URL, code exchange, refresh) with strict env separation.
- **Data Sources**: Supabase PostgreSQL (RLS enforced) + Excel/CSV imports from `data/` (member dues, timelines) + Schwab APIs.
- **Tooling**: ESLint, Tailwind, PostCSS; Vercel deployment; environment files defined in `.env.example`.

---

## 3. High-Level Directory Map
```
FFAinvestments/
├─ src/
│  ├─ App.jsx                 # Router + QueryClient + Providers
│  ├─ Layout.jsx              # Role-aware sidebar + redirects
│  ├─ components/             # UI widgets (ModernLogin, MemberAccountDashboard, etc.)
│  ├─ contexts/               # AuthContext, ThemeProvider
│  ├─ hooks/                  # Reusable data hooks
│  ├─ lib/                    # API wrappers (ffaApi.js/ts, queries.js), auth helpers
│  ├─ Pages/                  # Feature pages (Admin*, Member*, Education, Schwab, Settings)
│  ├─ services/               # External service helpers
│  ├─ styles/, utils/         # Theme + helper utilities (e.g., createPageUrl)
│  └─ ThemeProvider.jsx       # Dark theme + CSS vars
├─ backend/
│  ├─ server.js               # Schwab OAuth endpoints
│  └─ index.js                # Backend entry (imports server)
├─ data/                      # Live Excel + CSV files (member dues, timelines)
├─ docs/                      # Existing guides (setup, runbooks, changelog, Schwab)
├─ doc/                       # New summaries (this file)
├─ database/                  # Supabase schema + SQL scripts
├─ supabase/                  # Additional Supabase config/exported schema
├─ scripts/                   # Utility Node/PowerShell scripts for data upkeep
├─ package.json               # Frontend scripts & deps
└─ backend/package.json       # Backend scripts & deps
```

> For a deep historical reference, see `docs/project-structure.txt` and `docs/README-DOCS.md`.

---

## 4. Navigation & Routing Model
- **Router Definition**: `src/App.jsx` wires all routes inside `Router > Routes`. All protected surfaces are wrapped in `<ProtectedRoute>`; admin-only pages set `requireAdmin`.
- **Layout**: All authenticated pages render inside `Layout` which renders sidebar navigation from `adminNav` and `memberNav`. Admins see a merged, de-duplicated list.
- **Key Routes** (component mapping):
  - `/login` → `ModernLogin` (role-based redirect to `/admin/dashboard` or `/member/accounts`).
  - `/admin/dashboard` → `AdminDashboard_Hero` (primary admin landing).
  - `/admin/accounts` → `AdminPositions` (also linked from member nav for transparency).
  - `/admin/dues`, `/admin/ledger`, `/admin/unit-price`, `/admin/education`, `/admin/schwab`, `/admin/schwab/insights`, `/admin/schwab/raw-data`, `/admin/login-activity`, `/admin/settings`, `/admin/user-management`, `/admin/members`, `/admin/portfolio-builder`, `/admin/seed-unit`, `/admin/debug-auth`.
  - `/member/accounts` → `MemberHome` (member landing, renamed "Home" in sidebar).
  - `/member/dashboard`, `/member/contribute`, `/member/feed`, `/member/:memberId/dashboard`.
  - `/education/catalog`, `/education/unit-value-system`, `/education/unit-value-guide`, `/education/beardstown-ladies` (education bundle rendered inside Layout when appropriate).
  - `/settings` → `SettingsPage` (shared preferences, landing page selection, etc.).
  - `/invite/:token`, `/claim-account`, `/reset-password`, `/auth/callback`, `/admin/schwab/callback`, `/callback` for auth/onboarding flows.
- **Redirect Rules**: `/` & `/dashboard` push to `/admin/dashboard`. `/member` & `/member/home` redirect to `/member/accounts`. Unknown routes -> `/login`.

---

## 5. Data, APIs & Integrations
- **Supabase**: Primary source for members, accounts, ledger, unit prices, education lessons/progress, login activity. Accessed via `@supabase/supabase-js` clients and wrappers in `src/lib/ffaApi.(js|ts)` plus React Query hooks (`src/lib/queries.js`). RLS ensures row-level safety.
- **Excel/CSV Imports**: Real member dues and timeline data stored in `data/` (e.g., `member_dues_20251116_150358.xlsx`, `ffa_timeline.csv`). Scripts in repo (`read-excel.cjs`, `import-data.js`, `scripts/*`) parse and push into Supabase.
- **Schwab OAuth Backend**: `backend/server.js` exposes `/api/schwab/auth-url`, `/api/schwab/exchange`, `/api/schwab/refresh`, and `/health`. Frontend stores only Schwab client ID; secrets remain server-side.
- **React Query**: Globally provided `QueryClient` caches Supabase calls; mutations trigger refetch for live views.
- **Theming**: Theme context & `ThemeToggle` manage CSS variables for "bg-surface" etc., ensuring consistent dark UI.

---

## 6. Environment & Secrets
Refer to `.env.example` for the authoritative list.

### Frontend (`.env` loaded by Vite)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
VITE_SCHWAB_CLIENT_ID=issued-client-id
VITE_SCHWAB_REDIRECT_URI=https://app.yourclub.com/admin/schwab/callback
VITE_BACKEND_URL=https://backend.yourclub.com
VITE_SCHWAB_ALLOWED_REDIRECTS=https://app.yourclub.com/admin/schwab/callback,...
```

### Backend (`backend/.env` or deployment vars)
```
SCHWAB_CLIENT_ID=issued-client-id
SCHWAB_CLIENT_SECRET=server-only-secret
SCHWAB_REDIRECT_URI=https://app.yourclub.com/admin/schwab/callback
SCHWAB_REDIRECT_URI_ALLOWED=https://...
FRONTEND_ORIGIN=https://app.yourclub.com
PORT=4001
```

> Secrets related to Schwab MUST stay on the backend; never bake them into the Vite bundle.

---

## 7. Operations Runbook (Dev → Production)
1. **Install Prereqs**: Node 18+, npm 10+, Supabase project, Schwab dev app, Vercel CLI (optional), OpenSSL for local HTTPS testing.
2. **Clone & Install**:
   - `git clone https://github.com/ArchieCrawford/FFAInvestments.git`
   - `cd FFAinvestments && npm install`
   - `cd backend && npm install`
3. **Configure Environment**:
   - `cp .env.example .env` (root) & fill Supabase + Schwab public vars.
   - Create `backend/.env` (or export vars) with Schwab secret + origin.
4. **Seed Data (optional)**:
   - Place current Excel/CSV into `data/`.
   - Use provided scripts (`import-data.js`, `scripts/`, or Supabase SQL in `database/` + `supabase/`).
5. **Run Local Dev**:
   - Backend: `npm start` inside `backend/` (runs `node index.js` → `server.js`).
   - Frontend: `npm run dev` at repo root (Vite default port 5173). Configure proxies or set `VITE_BACKEND_URL` to backend origin.
6. **Testing & Quality**:
   - `npm run lint` for ESLint guardrails.
   - `npm run build` to ensure Vite bundles cleanly (already succeeds per latest run).
7. **Preview Build**: `npm run preview` after `npm run build` to test the production bundle locally.
8. **Deployment**:
   - Frontend: `npm run build` then deploy `/dist` to Vercel (see `vercel.json` or `docs/VERCEL_*`).
   - Backend: Deploy Express server to Render/Fly/Heroku; ensure env vars and HTTPS certs align with Schwab requirements.
9. **Post-Deploy Checklist**:
   - Hit `/health` on backend.
   - Run through `/login`, confirm member/admin redirect, check `/admin/schwab` OAuth handshake (requires HTTPS), verify Supabase reads/writes.

---

## 8. Rebuild Checklist for Another AI
1. **Study** this file plus `docs/PROJECT_RECREATION_GUIDE_2025-11-17.md` and `docs/OPERATIONS_RUNBOOK_2025-11-17.md` for deeper dives.
2. **Recreate Folder Skeleton** using the directory map above, ensuring `src/` subfolders and backend exist.
3. **Implement Providers** (`ThemeProvider`, `AuthProvider`, `QueryClient`) exactly as in `src/main.jsx`/`App.jsx`.
4. **Copy Route Table** from `src/App.jsx`, ensuring redirects and `<ProtectedRoute>` semantics match.
5. **Reproduce Layout** (sidebar definitions + member/admin merging + redirect behavior) from `src/Layout.jsx`.
6. **Restore Key Pages**:
   - Admin: dashboards, accounts, dues, ledger, unit price, education, Schwab trio, login activity, settings, portfolio builder, debug tools.
   - Member: `MemberHome`, dashboards, feed, contribute, settings, education, account drill-down.
7. **Implement Data Layer**: `src/lib/ffaApi.(js|ts)` + `queries.js` functions referencing Supabase tables and React Query caches.
8. **Wire Supabase** with environment variables and confirm RLS policies from `supabase-schema.sql`.
9. **Configure Backend**: replicate `backend/server.js`, Express routes, and env validation for Schwab OAuth.
10. **Add Data Files**: ensure `data/` includes the current Excel + CSV templates referenced by scripts.
11. **Validate** using `npm run lint`, `npm run build`, and manual QA via Vite preview + backend health check.

---

## 9. Key Reference Documents (Existing)
- `docs/PROJECT_RECREATION_GUIDE_2025-11-17.md` – granular rebuild walkthrough.
- `docs/OPERATIONS_RUNBOOK_2025-11-17.md` & `docs/RUNBOOK_2025-11-21.md` – day-to-day + incident response.
- `docs/PROJECT_RUNBOOK.md` and `docs/QUICK_REFERENCE.md` – condensed commands and workflows.
- `docs/SCHWAB_INTEGRATION.md` & `docs/SCHWAB_OAUTH_BACKEND.md` – compliance for Schwab APIs.
- `docs/SUPABASE_SETUP.md` & `supabase-schema.sql` – data model + security.
- `directory-structure.txt` – more exhaustive tree if needed.

Leverage those resources alongside this snapshot to recreate or onboard any collaborator rapidly.
