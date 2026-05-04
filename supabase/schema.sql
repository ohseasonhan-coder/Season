-- Season CFO Advanced Cloud Sync Schema
-- 적용 위치: Supabase Project > SQL Editor > Run
-- 목적: 사용자별 프로필, 수동 스냅샷, 감사 로그를 안전하게 저장합니다.

create extension if not exists pgcrypto;

create table if not exists public.asset_app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 10,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_app_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'manual',
  payload jsonb not null default '{}'::jsonb,
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

alter table public.asset_app_profiles enable row level security;
alter table public.asset_app_snapshots enable row level security;
alter table public.asset_app_audit_logs enable row level security;

drop policy if exists "asset profiles select own" on public.asset_app_profiles;
drop policy if exists "asset profiles insert own" on public.asset_app_profiles;
drop policy if exists "asset profiles update own" on public.asset_app_profiles;
drop policy if exists "asset snapshots select own" on public.asset_app_snapshots;
drop policy if exists "asset snapshots insert own" on public.asset_app_snapshots;
drop policy if exists "asset snapshots delete own" on public.asset_app_snapshots;
drop policy if exists "asset audit select own" on public.asset_app_audit_logs;
drop policy if exists "asset audit insert own" on public.asset_app_audit_logs;

create policy "asset profiles select own"
  on public.asset_app_profiles for select
  using (auth.uid() = user_id);

create policy "asset profiles insert own"
  on public.asset_app_profiles for insert
  with check (auth.uid() = user_id);

create policy "asset profiles update own"
  on public.asset_app_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "asset snapshots select own"
  on public.asset_app_snapshots for select
  using (auth.uid() = user_id);

create policy "asset snapshots insert own"
  on public.asset_app_snapshots for insert
  with check (auth.uid() = user_id);

create policy "asset snapshots delete own"
  on public.asset_app_snapshots for delete
  using (auth.uid() = user_id);

create policy "asset audit select own"
  on public.asset_app_audit_logs for select
  using (auth.uid() = user_id);

create policy "asset audit insert own"
  on public.asset_app_audit_logs for insert
  with check (auth.uid() = user_id);

create index if not exists idx_asset_app_profiles_updated
  on public.asset_app_profiles(user_id, updated_at desc);

create index if not exists idx_asset_app_snapshots_user_created
  on public.asset_app_snapshots(user_id, created_at desc);

create index if not exists idx_asset_app_audit_user_created
  on public.asset_app_audit_logs(user_id, created_at desc);
