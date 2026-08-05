-- 0002: Per-user auth model. Scope analyses to their author, add the picked
-- requirement code, enable RLS, and move the system prompt to a per-user table.

-- ── analyses: owner + requirement code ──────────────────────────────────────
alter table public.analyses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.analyses add column if not exists req_num text;

-- Pre-auth prototype rows have no owner and would be invisible under RLS anyway.
delete from public.analyses where user_id is null;

alter table public.analyses enable row level security;

drop policy if exists "analyses select own" on public.analyses;
create policy "analyses select own" on public.analyses
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "analyses insert own" on public.analyses;
create policy "analyses insert own" on public.analyses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "analyses delete own" on public.analyses;
create policy "analyses delete own" on public.analyses
  for delete to authenticated using (user_id = auth.uid());

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);

-- ── per-user settings (system prompt) ───────────────────────────────────────
-- Replaces the old global `settings` row. One row per user, own-row RLS.
create table if not exists public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  system_prompt text,
  updated_at    timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings select own" on public.user_settings;
create policy "user_settings select own" on public.user_settings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_settings insert own" on public.user_settings;
create policy "user_settings insert own" on public.user_settings
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_settings update own" on public.user_settings;
create policy "user_settings update own" on public.user_settings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
