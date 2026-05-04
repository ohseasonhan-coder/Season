# Season CFO 상용화 베이스 패키지

이 패키지는 기존 Vite + React 프로젝트를 상용 서비스 형태로 확장하기 위한 교체형 베이스입니다.

## 포함 기능

- `src/App.jsx` 완성형 교체 파일
- 분배 입력 구조
- 저장 전 확인 흐름
- 입력 검증 / 오류 / 경고 구조
- ISA 한도 체크 구조
- 비상금 목표 추적 구조
- 백업 / 복원 흐름
- Supabase 연동 준비 코드
- Supabase DB / RLS SQL 스키마
- Vercel 배포 설정
- GitHub 업로드용 구조

## 가장 안전한 적용 방법

기존 프로젝트가 이미 있다면 전체를 덮어쓰기보다 먼저 아래 파일만 교체하세요.

```text
src/App.jsx
```

그 후 GitHub에 push하면 Vercel에서 자동 빌드됩니다.

## 전체 패키지로 새 프로젝트를 구성하는 경우

```bash
npm install
npm run build
```

빌드가 성공하면 GitHub에 올리세요.

```bash
git add .
git commit -m "Add Season CFO commercial base"
git push origin main
```

## Supabase 사용 여부

Supabase를 사용하지 않아도 앱은 로컬 저장 기반으로 동작합니다.
클라우드 저장을 사용하려면 다음을 설정하세요.

1. Supabase 프로젝트 생성
2. `supabase/schema.sql` 실행
3. Vercel 환경변수 추가
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 주의

이 패키지는 상용화를 위한 베이스입니다. 실제 결제, 본인인증, 금융기관 자동연동, 세법 자동 업데이트, 개인정보 처리방침, 이용약관, 서버 로그 모니터링은 별도 구축이 필요합니다.
