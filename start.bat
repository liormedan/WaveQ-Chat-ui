@echo off
chcp 65001 >nul
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

:MENU
echo ========================================
echo           בחר מצב הפעלה
echo ========================================
echo.
echo 1. 👤 מצב אדמין - כניסה ישירה ללא הרשמה
echo 2. 🌐 מצב רגיל - עם דף כניסה והרשמה
echo 3. ❌ יציאה
echo.
set /p choice="הכנס את בחירתך (1-3): "

if "%choice%"=="1" goto ADMIN_MODE
if "%choice%"=="2" goto USER_MODE
if "%choice%"=="3" goto EXIT
echo ❌ בחירה לא חוקית, נסה שוב...
echo.
goto MENU

:ADMIN_MODE
echo.
echo 👤 מפעיל במצב אדמין...
echo 🔧 מגדיר משתני סביבה לאדמין...

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ קובץ .env.local לא נמצא!
    echo אנא צור קובץ .env.local עם הגדרות Supabase
    pause
    goto MENU
)

REM Create admin environment
copy .env.local .env.admin.backup >nul 2>&1

REM Add admin mode variables to existing .env.local
echo. >> .env.local
echo # Admin Mode - Skip Authentication >> .env.local
echo SKIP_AUTH=true >> .env.local
echo ADMIN_MODE=true >> .env.local

goto START_SERVER

:USER_MODE
echo.
echo 🌐 מפעיל במצב רגיל...
echo 🔧 מגדיר משתני סביבה למשתמשים...

REM Restore normal environment
if exist .env.admin.backup (
    copy .env.admin.backup .env.local >nul 2>&1
    del .env.admin.backup >nul 2>&1
) else (
    REM Remove admin mode variables if they exist
    if exist ".env.local" (
        findstr /v "SKIP_AUTH ADMIN_MODE" .env.local > .env.temp
        move .env.temp .env.local >nul 2>&1
    )
    
    REM Add user mode variables
    echo. >> .env.local
    echo # User Mode - With Authentication >> .env.local
    echo SKIP_AUTH=false >> .env.local
    echo ADMIN_MODE=false >> .env.local
    echo ALLOW_GUEST=true >> .env.local
)

goto START_SERVER

:START_SERVER
echo.
echo 🗄️  בודק הגדרות בסיס נתונים...
pnpm run db:migrate
echo.

echo 🚀 מפעיל שרת פיתוח...
echo 🌐 השרת יהיה זמין בכתובת: http://localhost:3000
echo 🛑 לחץ Ctrl+C לעצירת השרת
echo.
echo ========================================
if "%choice%"=="1" (
    echo    מצב אדמין פעיל - כניסה ישירה
) else (
    echo    מצב רגיל פעיל - עם הרשמה וכניסה
)
echo ========================================
echo.

pnpm run dev

goto END

:EXIT
echo.
echo 👋 יציאה מהתוכנית...
goto END

:END
pause