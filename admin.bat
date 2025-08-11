@echo off
echo Starting in ADMIN MODE - No login required
echo.

REM Kill any existing node processes
taskkill /f /im node.exe >nul 2>&1

REM Update .env.local for admin mode
powershell -Command "(Get-Content .env.local) -replace 'SKIP_AUTH=false', 'SKIP_AUTH=true' -replace 'ADMIN_MODE=false', 'ADMIN_MODE=true' | Set-Content .env.local"

echo Admin mode activated!
echo Starting server...
echo Server will skip login page
echo.
pnpm run dev