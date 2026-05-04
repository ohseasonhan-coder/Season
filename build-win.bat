@echo off
chcp 65001 > nul
title Season 개인 CFO 앱 - Windows 실행파일 빌드

echo ====================================================
echo   Season 개인 CFO 앱 Windows 실행파일 빌드
echo ====================================================
echo.

call npm install
if errorlevel 1 (
  echo [오류] npm install 실패
  pause
  exit /b 1
)

call npm run dist
if errorlevel 1 (
  echo [오류] Electron 빌드 실패
  pause
  exit /b 1
)

echo.
echo 완료: release 폴더를 확인하세요.
pause
