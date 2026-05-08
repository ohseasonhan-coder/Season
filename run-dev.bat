@echo off
chcp 65001 > nul
title Season 개인 CFO 앱 - 로컬 개발 실행

echo ====================================================
echo   Season 개인 CFO 앱 로컬 개발 실행
echo ====================================================
echo.

call npm install
if errorlevel 1 (
  echo [오류] npm install 실패
  pause
  exit /b 1
)

call npm run dev
pause
