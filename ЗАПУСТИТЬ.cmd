@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  set PY=python
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    set PY=py
  ) else (
    echo Python not found. Start any local web server in this folder.
    pause
    exit /b
  )
)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080/"
%PY% -m http.server 8080
