# Season 개인 CFO 자산관리 앱 v12

이 패키지는 GitHub 저장소를 모두 비운 뒤 그대로 업로드할 수 있는 **전체 교체용 완성본**입니다.

## 기준

이 버전은 사용자가 선호한 고기능 `App.jsx`를 유지하고, 로그인 입력 포커스 오류를 수정한 통합본을 기준으로 합니다.

## 포함된 핵심 기능

- Supabase 로그인 / 클라우드 동기화 구조
- Supabase 미설정 시 로컬 저장 모드
- 로그인 입력 포커스 오류 수정
- 자동 백업 / 복원
- 데이터 마이그레이션
- 거래내역
- 계좌 관리
- 자산 / 부채 관리
- 포트폴리오 관리
- 예산 관리
- 이벤트 / 목표 관리
- ISA 설정
- 연금 / 세금 관련 설정
- 투자 목표 관리
- 자동 트리거
- CFO 분석 기능
- 사이드바 접이식 UX
- 모바일 로그인 시트
- Vercel 배포 구조
- public 폴더
- vercel.json
- Electron 선택 실행 구조
- Windows BAT 파일

## GitHub에 올리는 방법

자세한 내용은 `docs/01_GITHUB_REPLACE_GUIDE.md`를 확인하세요.

## Vercel 환경변수

Supabase를 쓰려면 Vercel에서 아래 환경변수를 등록하세요.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Supabase를 쓰지 않으면 로컬 저장 모드로 실행됩니다.

## 로컬 빌드 확인

```bash
npm install
npm run build
```

또는 Windows에서:

```bash
build-check.bat
```
