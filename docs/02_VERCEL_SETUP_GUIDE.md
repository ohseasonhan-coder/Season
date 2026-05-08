# Vercel 배포 설정

## 기본 설정

Vercel 프로젝트 설정에서 아래처럼 맞추세요.

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## 환경변수

Supabase 로그인/클라우드 동기화를 쓸 경우:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

위 2개를 Vercel > Project Settings > Environment Variables 에 등록하세요.

## Supabase를 아직 안 쓰는 경우

환경변수를 비워도 됩니다. 앱은 로컬 저장 모드로 작동합니다.

## 올려주신 로그 해석

로그가 아래에서 멈춘 것처럼 보였다면:

```text
transforming...
✓ 15 modules transformed.
```

이 줄 자체는 오류 메시지가 아닙니다. 실제 오류는 보통 그 아래에 `error`, `failed`, `Could not resolve`, `Unexpected token` 같은 문구로 나옵니다.

다만 이번 패키지는 Vercel용 `vercel.json`, `vite.config.js`, `package.json`, `public` 폴더를 포함해 전체 배포 구조를 정리했습니다.
