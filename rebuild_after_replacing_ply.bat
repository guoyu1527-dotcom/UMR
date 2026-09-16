@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo .venv not found. Run setup_windows.bat first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" tools\build_all.py
pause
