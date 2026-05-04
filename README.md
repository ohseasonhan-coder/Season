# 개인 CFO 자산관리 앱 v7 - 사용자가 선호한 기능형 App.jsx 기반

이 패키지는 사용자가 업로드한 `App_v2_split_confirm_integrated_fixed(1).jsx`를 중심으로 만든 전체 프로젝트입니다.

## 핵심 방향

- 기능을 줄인 단순 버전이 아니라, 기존에 마음에 들었던 고기능 버전을 메인으로 사용
- Electron 실행 구조 포함
- Windows 빌드 BAT 포함
- 검은 화면 방지 ErrorBoundary 포함
- Supabase는 선택 사항
- Supabase 설정이 없으면 로컬 저장 기반으로 실행

## 포함 구조

```text
package.json
index.html
vite.config.js
.env.example
.gitignore
build-win.bat
run-dev.bat
run-electron-dev.bat

src/
 ├─ main.jsx
 └─ App.jsx

electron/
 ├─ main.cjs
 └─ preload.cjs

docs/
 ├─ GITHUB-UPLOAD-GUIDE.md
 └─ PROJECT-STRUCTURE.md
```

## 실행 방법

```bash
npm install
npm run dev
```

## Electron 개발 실행

```bash
npm run electron:dev
```

또는:

```bash
run-electron-dev.bat
```

## Windows 실행파일 빌드

```bash
build-win.bat
```

완료 후 `release` 폴더를 확인하세요.

## Supabase 설정

`App.jsx`에서 아래 환경변수를 사용합니다.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Supabase를 사용하지 않을 경우 비워둬도 됩니다. 앱은 로컬 저장 방식으로 실행됩니다.
