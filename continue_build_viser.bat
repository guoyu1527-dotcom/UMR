@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo Continue - Convert PLY files to .viser
echo ============================================

if not exist ".venv\Scripts\python.exe" (
  echo ERROR: .venv not found.
  pause
  exit /b 1
)

if not exist "static\viser-client\index.html" (
  echo ERROR: static\viser-client\index.html not found.
  echo Run fix_viser_and_continue_v2.bat first.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" tools\build_all.py
if errorlevel 1 goto :error

echo.
echo ============================================
echo GENERATED FILE CHECK
echo ============================================

for %%F in (
  "data\interactive\real-scenes\scene-01\scene-pred.viser"
  "data\interactive\real-scenes\scene-01\scene-gt.viser"
  "data\interactive\sim-scenes\scene-01\scene-pred.viser"
  "data\interactive\sim-scenes\scene-01\scene-gt.viser"
) do (
  if exist %%F (
    echo OK: %%~F
  ) else (
    echo MISSING: %%~F
  )
)

echo.
echo SUCCESS. Now run:
echo   .\run_local.bat
pause
exit /b 0

:error
echo.
echo FAILED. Copy the complete error output to ChatGPT.
pause
exit /b 1
