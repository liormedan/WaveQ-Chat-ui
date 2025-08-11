@echo off
echo Starting in USER MODE - With login and registration
echo.

REM Kill any existing node processes
taskkill /f /im node.exe >nul 2>&1

REM Update .env.local for user mode
powershell -Command "(Get-Content .env.local) -replace 'SKIP_AUTH=true', 'SKIP_AUTH=false' -replace 'ADMIN_MODE=true', 'ADMIN_MODE=false' | Set-Content .env.local"

echo User mode activated!
echo Starting server...
echo Server will show login/registration page
echo.
pnpm run dev