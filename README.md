# IFS Food — Analyse IA des Constats

Multi-user web app that arbitrates IFS Food v8 audit non-conformities ("D" vs
"Major") with Vertex AI (Gemini). Auditors pick an IFS requirement from a searchable
dropdown, describe the observation, and get an expert analysis plus a validator
verdict. Each user has private history behind email/password auth.

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Auth +
  Postgres, RLS) · Google Vertex AI.
- **IFS data:** the 232 IFS Food v8 requirements live in `ifs_requirements`,
  seeded from `supabase/seed/ifs_requirements.sql` (IFS Food only — other
  standards excluded).

## Setup

### 1. Environment

```bash
cp .env.example .env.local   # then fill in the values
npm install
```

`.env.local` needs this app's own Supabase project URL + anon key plus Vertex
configuration:

- `VERTEX_PROJECT_ID` (GCP project id)
- `VERTEX_LOCATION` (for example `europe-west1`)
- `VERTEX_MODEL` (for example `gemini-2.5-flash`)
- `GOOGLE_APPLICATION_CREDENTIALS` (path to your service-account JSON for local dev)

No reference-DB key is needed (IFS data is baked into the seed file).

### 2. Database

In the Supabase SQL editor (or `supabase db` CLI), run in order:

1. `supabase/migrations/0000_base.sql` — base `analyses` table (`if not exists`; no-op on an existing app DB).
2. `supabase/migrations/0001_ifs_requirements.sql` — reference table + RLS.
3. `supabase/seed/ifs_requirements.sql` — the 232 IFS requirements (idempotent).
4. `supabase/migrations/0002_auth_and_rls.sql` — per-user `analyses`/`user_settings` + RLS.

> The migration set is self-contained, so you can point the app at your existing
> Supabase project **or** a fresh one. `0002` deletes any pre-auth rows in
> `analyses` (prototype data with no owner).

### 3. Supabase Auth

- **Authentication > Providers > Email:** enabled.
- For quick local testing, turn **"Confirm email" off** so sign-up logs in
  immediately. If left on, add `http://localhost:3000/auth/callback` (and your
  production equivalent) under **Authentication > URL Configuration > Redirect URLs**.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Create an account,
then submit an observation.

## How it works

- `src/proxy.ts` (this Next.js version renames `middleware` → `proxy`) refreshes
  the Supabase session and redirects signed-out users to `/login`.
- `src/app/api/analyze/route.ts` verifies the session, runs two Vertex AI calls
  (analyst + validator), and inserts the result stamped with `user_id` — RLS
  guarantees users only ever see or delete their own analyses.
- `src/components/RequirementCombobox.tsx` is the searchable IFS requirement
  picker (number or keyword, accent-insensitive).

## Verification checklist

1. Unauthenticated visit to `/` redirects to `/login`.
2. Requirement dropdown lists IFS requirements and filters by number/keyword.
3. Sign up user A, run an analysis → appears in A's history with its req number.
4. Sign up user B → history empty; B cannot see A's analyses (RLS).
