@echo off
chcp 65001 > nul
title Season 개인 CFO 앱 - Vercel 빌드 사전 확인

echo ====================================================
echo   Vercel 업로드 전 빌드 확인
echo ====================================================
echo.

call npm install
if errorlevel 1 (
  echo [오류] npm install 실패
  pause
  exit /b 1
)

call npm run build
if errorlevel 1 (
  echo [오류] npm run build 실패
  pause
  exit /b 1
)

echo.
echo 성공: dist 폴더가 생성되었습니다. GitHub/Vercel 업로드 가능 상태입니다.
pause
