@echo off
echo ========================================
echo    AI Chatbot Development Server
echo ========================================
echo.

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: pnpm is not installed or not in PATH
    echo Please install pnpm first: npm install -g pnpm
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo ❌ Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Check database configuration
echo �️  Checkging database configuration...
pnpm run db:migrate
echo.

REM Start the development server
echo 🚀 Starting development server...
echo 🌐 Server will be available at: http://localhost:3000
echo 🛑 Press Ctrl+C to stop the server
echo.
pnpm run dev

pause