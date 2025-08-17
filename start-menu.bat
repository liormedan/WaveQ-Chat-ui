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
echo Starting Admin Mode...
echo Killing existing servers...
taskkill /f /im node.exe >nul 2>&1

echo Copying admin environment...
if exist ".env.admin" (
    copy .env.admin .env.local >nul 2>&1
    echo Admin environment activated!
) else (
    echo Error: .env.admin file not found!
    pause
    goto MENU
)

goto START_SERVER

:USER_MODE
echo.
echo Starting User Mode...
echo Killing existing servers...
taskkill /f /im node.exe >nul 2>&1

echo Copying user environment...
if exist ".env.user" (
    copy .env.user .env.local >nul 2>&1
    echo User environment activated!
) else (
    echo Error: .env.user file not found!
    pause
    goto MENU
)

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
    echo    ADMIN MODE ACTIVE - Direct Access
) else (
    echo    USER MODE ACTIVE - With Authentication
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