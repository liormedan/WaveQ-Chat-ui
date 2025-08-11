@echo off
echo ========================================
echo    AI Chatbot Development Server
echo ========================================
echo.

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: pnpm is not installed
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install
    echo.
)

:MENU
echo ========================================
echo           Choose Mode
echo ========================================
echo.
echo 1. Admin Mode - Direct access without login
echo 2. User Mode - With login and registration
echo 3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto ADMIN_MODE
if "%choice%"=="2" goto USER_MODE
if "%choice%"=="3" goto EXIT
echo Invalid choice, try again...
echo.
goto MENU

:ADMIN_MODE
echo.
echo Starting in Admin Mode...
echo Setting up admin environment...

REM Backup current .env.local
if exist ".env.local" copy .env.local .env.admin.backup >nul 2>&1

REM Add admin mode variables
echo. >> .env.local
echo # Admin Mode - Skip Authentication >> .env.local
echo SKIP_AUTH=true >> .env.local
echo ADMIN_MODE=true >> .env.local

goto START_SERVER

:USER_MODE
echo.
echo Starting in User Mode...
echo Setting up user environment...

REM Restore from backup if exists
if exist .env.admin.backup (
    copy .env.admin.backup .env.local >nul 2>&1
    del .env.admin.backup >nul 2>&1
)

REM Add user mode variables
echo. >> .env.local
echo # User Mode - With Authentication >> .env.local
echo SKIP_AUTH=false >> .env.local
echo ADMIN_MODE=false >> .env.local
echo ALLOW_GUEST=true >> .env.local

goto START_SERVER

:START_SERVER
echo.
echo Checking database configuration...
pnpm run db:migrate
echo.

echo Starting development server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
if "%choice%"=="1" (
    echo    Admin Mode Active - Direct Access
) else (
    echo    User Mode Active - With Authentication
)
echo ========================================
echo.

pnpm run dev

goto END

:EXIT
echo.
echo Exiting...
goto END

:END
pause