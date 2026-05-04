# Season CFO App - GitHub Drop-in Final

이 ZIP은 **GitHub 저장소 안의 기존 파일을 전부 삭제한 뒤 그대로 넣기만 하면 되는 버전**입니다.

## 사용 방법

1. GitHub 저장소 안 기존 파일 전체 삭제
2. 이 ZIP 압축 해제
3. 압축 해제된 내용물을 저장소 루트에 그대로 복사
4. GitHub에 push
5. Vercel 자동 배포 확인

```bash
git add .
git commit -m "Replace with Season CFO drop-in final"
git push origin main
```

## 포함 기능

- 대시보드
- 분배입력
- 저장 전 검증/확인
- 비상금 목표 추적
- ISA 한도 체크
- 로컬 저장
- Supabase 로그인
- 클라우드 저장/불러오기
- AI/로컬 CFO 리포트
- JSON 백업/복구
- 암호화 백업
- Supabase Storage 암호화 업로드
- 운영센터
- 알림센터
- 관리자 권한 확인 베이스
- 데이터 품질 점수
- 진단 JSON
- PWA 기본 구성
- Supabase SQL/RLS
- Edge Functions 베이스
- GitHub Actions 빌드 체크

## 확인

```bash
node scripts/project-check.mjs
npm run build
```

## Supabase

SQL Editor에서 실행:

```text
supabase/sql/schema.sql
```

Storage bucket:

```text
season-secure-backups
```

결제 기능은 포함하지 않았습니다.


## Blank Screen Fix 포함

이 버전은 검은 화면 방지를 위해 아래 처리가 추가되어 있습니다.

- vite.config.js
- ErrorBoundary
- 기존 Service Worker / Cache 자동 정리
- 렌더링 오류 발생 시 오류 화면 표시

배포 후에도 검은 화면이면 브라우저에서 아래를 실행하세요.

1. F12
2. Application
3. Storage
4. Clear site data
5. 새로고침
