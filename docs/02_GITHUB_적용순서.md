# GitHub 적용 순서

## 가장 안전한 적용
기존 저장소를 지우지 않습니다.

1. `src/App.jsx`만 먼저 교체
2. GitHub에 push
3. Vercel 빌드 성공 확인
4. 성공 후 아래 파일 추가
   - `supabase/schema.sql`
   - `.env.example`
   - `docs/`

## 터미널 명령어

```bash
git status
git add src/App.jsx supabase/schema.sql .env.example docs/
git commit -m "Add Supabase cloud sync hardening"
git push origin main
```

## package.json은 그대로 두세요
이미 빌드가 성공했다면 package.json은 바꾸지 않는 것이 안전합니다.
