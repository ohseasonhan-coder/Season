# GitHub 기존 파일 전체 삭제 후 새 패키지 업로드

## 1. 기존 프로젝트 폴더로 이동

```bash
cd "C:\Users\한승훈\Desktop\개인분석\1028\개인자산\앱버전_ver3\asset-app-electron-source-node20-fixed-v4-blank-screen-fix\asset-app-electron"
```

## 2. 기존 GitHub 파일 전체 삭제

```bash
git rm -r .
git commit -m "Remove old project files"
git push origin main
```

브랜치가 `master`면:

```bash
git push origin master
```

## 3. ZIP 압축 해제 후 파일 복사

압축을 푼 뒤 GitHub 연결 폴더 바로 아래에 아래 파일들이 보여야 합니다.

```text
package.json
index.html
vite.config.js
vercel.json
src
public
docs
electron
README.md
```

중요: 아래처럼 ZIP 폴더가 한 번 더 들어가면 안 됩니다.

```text
asset-app-electron
└─ season-asset-app-commercial-complete-v12
   ├─ package.json
   └─ src
```

반드시 이렇게 되어야 합니다.

```text
asset-app-electron
├─ package.json
├─ index.html
├─ src
├─ public
└─ vercel.json
```

## 4. 새 프로젝트 업로드

```bash
git add .
git commit -m "Upload complete commercial ready Season asset app"
git push origin main
```

## 5. Vercel에서 확인

Vercel은 자동으로 GitHub의 main 브랜치를 감지해 배포합니다.

빌드 설정:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```
