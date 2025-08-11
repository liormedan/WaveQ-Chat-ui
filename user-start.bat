@echo off
echo ========================================
echo    USER MODE - With Login/Register
echo ========================================

REM Kill existing servers
taskkill /f /im node.exe >nul 2>&1

REM Copy user environment
copy .env.user .env.local >nul 2>&1

echo User mode activated!
echo Starting server with authentication...
echo Server: http://localhost:3000
echo.

pnpm run dev
pause