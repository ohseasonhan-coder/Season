-- Season CFO commercial base schema
-- Supabase SQL Editor에서 실행하세요.
-- auth.users 기반 RLS를 사용합니다.

create table if not exists public.asset_app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_app_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.asset_app_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'manual',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.asset_app_profiles enable row level security;
alter table public.asset_app_audit_logs enable row level security;
alter table public.asset_app_snapshots enable row level security;

create policy "Users can read own profile"
  on public.asset_app_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.asset_app_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.asset_app_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own audit logs"
  on public.asset_app_audit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own audit logs"
  on public.asset_app_audit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can read own snapshots"
  on public.asset_app_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own snapshots"
  on public.asset_app_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own snapshots"
  on public.asset_app_snapshots for delete
  using (auth.uid() = user_id);

create index if not exists idx_asset_app_audit_logs_user_created
  on public.asset_app_audit_logs(user_id, created_at desc);

create index if not exists idx_asset_app_snapshots_user_created
  on public.asset_app_snapshots(user_id, created_at desc);
