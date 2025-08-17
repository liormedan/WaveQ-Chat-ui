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

REM Kill existing servers
taskkill /f /im node.exe >nul 2>&1

REM Check if .env.admin exists
if not exist ".env.admin" (
    echo ❌ קובץ .env.admin לא נמצא!
    echo אנא צור קובץ .env.admin עם הגדרות אדמין
    pause
    goto MENU
)

REM Copy admin environment
copy .env.admin .env.local >nul 2>&1
echo ✅ הועתק קובץ .env.admin ל-.env.local

goto START_SERVER

:USER_MODE
echo.
echo 🌐 מפעיל במצב רגיל...
echo 🔧 מגדיר משתני סביבה למשתמשים...

REM Kill existing servers
taskkill /f /im node.exe >nul 2>&1

REM Check if .env.user exists
if not exist ".env.user" (
    echo ❌ קובץ .env.user לא נמצא!
    echo אנא צור קובץ .env.user עם הגדרות משתמש
    pause
    goto MENU
)

REM Copy user environment
copy .env.user .env.local >nul 2>&1
echo ✅ הועתק קובץ .env.user ל-.env.local

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