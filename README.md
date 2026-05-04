# 개인 CFO 자산관리 앱 v6 - Electron 전체 패키지

이 패키지는 GitHub 저장소를 모두 삭제한 뒤 그대로 업로드할 수 있는 전체 프로젝트입니다.

## 포함 파일

```text
package.json
index.html
vite.config.js
src/main.jsx
src/App.jsx
src/styles.css
electron/main.cjs
electron/preload.cjs
build-win.bat
run-dev.bat
run-electron-dev.bat
.gitignore
README.md
docs/GITHUB-UPLOAD-GUIDE.md
```

## 주요 기능

- 전체 자산 대시보드
- 총자산 / 총부채 / 순자산
- CFO 점수
- 현금흐름 분석
- 자산 / 부채 관리
- 비상금 관리
- ISA 관리
- 투자 포트폴리오 분석
- 은퇴 시뮬레이션
- 세금 / 연금 코치
- 의사결정 센터
- 월간 리포트
- 백업 / 복원
- PC 사이드 메뉴
- 모바일 하단 탭바
- Electron 실행 구조
- Windows 빌드 BAT
- 검은 화면 방지 ErrorBoundary

## 웹 개발 실행

```bash
npm install
npm run dev
```

## Electron 개발 실행

```bash
npm install
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

## 주의

GitHub에는 `node_modules`, `dist`, `release` 폴더를 올리지 않아도 됩니다.
`.gitignore`에 제외되어 있습니다.
