# Supabase 체크리스트

## 필요한 환경변수

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 앱에서 사용하는 테이블

App.jsx 기준:

```text
asset_app_profiles
```

## 권장 테이블 예시

Supabase SQL Editor에서 상황에 맞게 조정하세요.

```sql
create table if not exists public.asset_app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.asset_app_profiles enable row level security;

create policy "Users can read own profile"
on public.asset_app_profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.asset_app_profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.asset_app_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

실제 App.jsx 내부 저장 방식에 따라 `upsert` 조건이나 컬럼명이 다르면 조정이 필요합니다.
