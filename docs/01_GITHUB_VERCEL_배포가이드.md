# GitHub / Vercel 배포 가이드

## 1. 파일 교체

기존 프로젝트에서 최소 교체 파일은 다음입니다.

```text
src/App.jsx
```

전체 상용화 구조까지 반영하려면 다음 파일도 추가하세요.

```text
.env.example
vercel.json
supabase/schema.sql
README.md
docs/*
scripts/basic-check.mjs
```

## 2. GitHub 업로드

```bash
git status
git add .
git commit -m "Add commercial CFO app base"
git push origin main
```

## 3. Vercel 확인

Vercel에서 다음 값이 맞는지 확인하세요.

| 항목 | 값 |
|---|---|
| Framework | Vite |
| Build Command | npm run build |
| Output Directory | dist |

## 4. Supabase 환경변수

Supabase를 사용할 경우 Vercel 환경변수에 아래를 추가합니다.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

환경변수를 추가한 뒤에는 반드시 재배포해야 합니다.
