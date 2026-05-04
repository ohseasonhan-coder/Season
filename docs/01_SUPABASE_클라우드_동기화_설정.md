# Supabase 클라우드 동기화 설정

## 결론
기존 GitHub 저장소를 지우지 말고, `src/App.jsx` 교체 후 Supabase 설정 파일만 추가하세요.

## 1. Supabase 프로젝트 생성
1. Supabase 접속
2. New project 생성
3. Project Settings > API에서 아래 값을 확인
   - Project URL
   - anon public key

## 2. DB 스키마 적용
Supabase > SQL Editor에서 `supabase/schema.sql` 전체를 붙여넣고 Run 합니다.

## 3. Authentication 설정
Supabase > Authentication > Providers에서 Email provider를 켭니다.

개발 초기에는 이메일 확인을 꺼도 되지만, 실제 서비스용이라면 이메일 확인을 켜는 편이 안전합니다.

## 4. Vercel 환경변수 등록
Vercel > Project > Settings > Environment Variables에서 아래를 추가합니다.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_PROFILE_TABLE=asset_app_profiles
VITE_SUPABASE_AUDIT_TABLE=asset_app_audit_logs
VITE_SUPABASE_SNAPSHOT_TABLE=asset_app_snapshots
```

환경변수 등록 후에는 반드시 새로 배포해야 합니다.

## 5. 테스트 순서
1. Vercel 배포 접속
2. 이메일/비밀번호로 가입
3. 앱에서 테스트 거래 입력
4. 상단의 저장 버튼 클릭
5. Supabase `asset_app_profiles` 테이블에 데이터가 들어갔는지 확인
6. 로그아웃 후 다시 로그인
7. 불러오기 버튼으로 데이터 복원 확인

## 주의
Supabase를 설정하지 않으면 앱은 로컬 전용 모드로 작동합니다.
