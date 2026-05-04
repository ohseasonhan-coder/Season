@echo off
chcp 65001 > nul
title 개인 CFO 자산관리 앱 - 웹 개발 실행

echo ====================================================
echo   개인 CFO 자산관리 앱 웹 개발 실행
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
