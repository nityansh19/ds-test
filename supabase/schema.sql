-- Run this in the SQL editor of a NEW, dedicated Supabase project.
-- All question keys and participant details are server-only, never public.
create extension if not exists pgcrypto;
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'Python',
  prompt text not null,
  choices jsonb not null check (jsonb_typeof(choices)='array' and jsonb_array_length(choices)=4),
  answer_index integer not null check (answer_index between 0 and 3),
  points integer not null default 5 check (points between 1 and 20),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  session_hash text not null unique,
  status text not null default 'active' check (status in ('active','submitted','disqualified','timed_out')),
  question_ids uuid[] not null,
  score integer not null default 0 check (score >= 0),
  max_score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  ends_at timestamptz not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  violation_reason text
);
create index if not exists attempts_score_idx on public.attempts (score desc, completed_at asc);
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
revoke all on table public.questions from anon, authenticated;
revoke all on table public.attempts from anon, authenticated;
grant all on table public.questions to service_role;
grant all on table public.attempts to service_role;
-- No anonymous or authenticated RLS policies. The server's secret
-- service-role key is the ONLY way the application accesses these tables.
-- Limit Supabase dashboard access to trusted organizers.
