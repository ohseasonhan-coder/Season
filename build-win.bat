@echo off
chcp 65001 > nul
title 개인 CFO 자산관리 앱 - Windows 빌드

echo ====================================================
echo   개인 CFO 자산관리 앱 Windows 빌드 시작
echo ====================================================
echo.

where node > nul 2> nul
if errorlevel 1 (
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo Node.js LTS 버전을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

where npm > nul 2> nul
if errorlevel 1 (
  echo [오류] npm을 찾을 수 없습니다.
  pause
  exit /b 1
)

echo [1/4] 패키지 설치 중...
call npm install
if errorlevel 1 (
  echo [오류] npm install 실패
  pause
  exit /b 1
)

echo.
echo [2/4] 웹앱 빌드 중...
call npm run build
if errorlevel 1 (
  echo [오류] Vite build 실패
  pause
  exit /b 1
)

echo.
echo [3/4] Electron 실행파일 빌드 중...
call npm run dist
if errorlevel 1 (
  echo [오류] Electron 빌드 실패
  pause
  exit /b 1
)

echo.
echo [4/4] 완료
echo release 폴더를 확인하세요.
pause
