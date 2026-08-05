-- 0000: Base schema for the analyses table. Uses `if not exists` so it is a
-- no-op on the existing app DB but also lets the full migration set stand up a
-- fresh project from scratch. (Auth columns + RLS are added in 0002.)

create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  observation text not null,
  perimetre   text not null,
  req_text    text not null,
  tv_remarq   text,
  grade       text,          -- 'D' | 'Majeure' | null
  reasoning   text,
  diff        text,
  created_at  timestamptz not null default now()
);
