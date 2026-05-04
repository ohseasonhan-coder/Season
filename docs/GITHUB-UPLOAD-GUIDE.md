# GitHub 전체 삭제 후 새 프로젝트 업로드 방법

## 1. Git 설치 확인

```bash
git --version
```

안 되면 Git for Windows를 먼저 설치하세요.

## 2. 기존 GitHub 연결 폴더로 이동

```bash
cd "C:\Users\한승훈\Desktop\개인분석\1028\개인자산\앱버전_ver3\asset-app-electron-source-node20-fixed-v4-blank-screen-fix\asset-app-electron"
```

## 3. 기존 파일 전체 삭제

```bash
git rm -r .
git commit -m "Remove old project files"
git push origin main
```

브랜치가 master면:

```bash
git push origin master
```

## 4. ZIP 압축 해제 후 파일 복사

압축을 푼 뒤 GitHub 연결 폴더 바로 아래에 아래 파일들이 보여야 합니다.

```text
package.json
index.html
vite.config.js
src
electron
build-win.bat
run-dev.bat
run-electron-dev.bat
README.md
```

아래처럼 한 번 더 폴더가 들어가면 안 됩니다.

```text
asset-app-electron
└─ personal-cfo-liked-version-electron-v7
   ├─ package.json
   └─ src
```

## 5. 새 프로젝트 업로드

```bash
git add .
git commit -m "Upload preferred full feature personal CFO app"
git push origin main
```

## 6. 실행 확인

```bash
npm install
npm run dev
```

Electron 실행:

```bash
npm run electron:dev
```
