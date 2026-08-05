-- 0001: IFS Food requirements — read-only reference data (IFS Food v8 only).
-- Populated by supabase/seed/ifs_requirements.sql (run that after this migration).

create extension if not exists pgcrypto;

create table if not exists public.ifs_requirements (
  id         uuid primary key default gen_random_uuid(),
  req_num    text not null unique,          -- e.g. "4.12.1"
  req_text   text not null,                 -- full requirement text (FR)
  chapter    text,                          -- top-level chapter number, e.g. "4"
  ko         boolean not null default false,-- knock-out requirement
  created_at timestamptz not null default now()
);

create index if not exists ifs_requirements_chapter_idx on public.ifs_requirements (chapter);

-- Reference data: readable by any signed-in user, never written from the client.
alter table public.ifs_requirements enable row level security;

drop policy if exists "ifs read for authenticated" on public.ifs_requirements;
create policy "ifs read for authenticated"
  on public.ifs_requirements
  for select
  to authenticated
  using (true);
