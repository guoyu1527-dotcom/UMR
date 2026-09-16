@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo 1/4 Creating .venv
echo ============================================
if not exist ".venv\Scripts\python.exe" (
  py -3.11 -m venv .venv 2>nul
  if errorlevel 1 py -m venv .venv 2>nul
  if errorlevel 1 python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" goto :error

echo ============================================
echo 2/4 Installing Python packages
echo ============================================
".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :error
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo ============================================
echo 3/4 Building static Viser client
echo ============================================
if exist "static\viser-client" rmdir /s /q "static\viser-client"
mkdir "static\viser-client"
".venv\Scripts\viser-build-client.exe" --output-dir "static\viser-client"
if errorlevel 1 goto :error

echo ============================================
echo 4/4 Converting PLY files and making manifest
echo ============================================
".venv\Scripts\python.exe" tools\build_all.py
if errorlevel 1 goto :error

echo.
echo SUCCESS.
echo Next run: run_local.bat
pause
exit /b 0

:error
echo.
echo FAILED. Copy the complete terminal output to ChatGPT.
pause
exit /b 1
