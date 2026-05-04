-- Season CFO App Drop-in Final Schema

create table if not exists public.season_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.season_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text,
  read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.season_ops_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  level text not null default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.season_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  request_type text not null default 'delete',
  reason text,
  status text not null default 'requested',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.season_profiles enable row level security;
alter table public.season_notifications enable row level security;
alter table public.season_ops_audit_logs enable row level security;
alter table public.season_privacy_requests enable row level security;

drop policy if exists "Users can manage own profile" on public.season_profiles;
create policy "Users can manage own profile"
on public.season_profiles for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own notifications" on public.season_notifications;
create policy "Users can manage own notifications"
on public.season_notifications for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own audit logs" on public.season_ops_audit_logs;
create policy "Users can manage own audit logs"
on public.season_ops_audit_logs for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own privacy requests" on public.season_privacy_requests;
create policy "Users can manage own privacy requests"
on public.season_privacy_requests for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists season_notifications_user_read_idx on public.season_notifications(user_id, read, created_at desc);
create index if not exists season_ops_audit_logs_user_created_idx on public.season_ops_audit_logs(user_id, created_at desc);
create index if not exists season_privacy_requests_user_status_idx on public.season_privacy_requests(user_id, status, created_at desc);

-- Storage bucket:
-- season-secure-backups
-- Private bucket 권장
