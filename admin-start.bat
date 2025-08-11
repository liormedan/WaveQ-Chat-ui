@echo off
echo ========================================
echo    ADMIN MODE - Direct Access
echo ========================================

REM Kill existing servers
taskkill /f /im node.exe >nul 2>&1

REM Copy admin environment
copy .env.admin .env.local >nul 2>&1

echo Admin mode activated!
echo Starting server without authentication...
echo Server: http://localhost:3000
echo.

pnpm run dev
pause