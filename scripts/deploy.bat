@echo off
REM 🚀 Vercel Deployment Script for Windows
REM This script helps prepare and deploy the application to Vercel

echo 🚀 Starting Vercel deployment preparation...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pnpm is not installed. Please install pnpm first.
    echo    npm install -g pnpm
    exit /b 1
)

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Build the project
echo 🔨 Building the project...
pnpm build

REM Check if build was successful
if errorlevel 1 (
    echo ❌ Build failed. Please check the errors above.
    exit /b 1
) else (
    echo ✅ Build completed successfully!
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local not found. Creating example file...
    (
        echo # AI Provider Configuration
        echo XAI_API_KEY=your-xai-api-key-here
        echo.
        echo # Authentication Configuration
        echo AUTH_SECRET=your-auth-secret-here
        echo.
        echo # Database Configuration ^(for production^)
        echo # POSTGRES_URL=postgresql://user:password@host:port/database
        echo.
        echo # Application Configuration
        echo NODE_ENV=production
        echo npm_package_version=3.1.0
    ) > .env.local
    echo 📝 Created .env.local.example. Please update it with your actual values.
)

REM Check if vercel.json exists
if not exist "vercel.json" (
    echo ⚠️  vercel.json not found. Creating...
    (
        echo {
        echo   "buildCommand": "pnpm build",
        echo   "devCommand": "pnpm dev",
        echo   "installCommand": "pnpm install",
        echo   "framework": "nextjs",
        echo   "regions": ["iad1"],
        echo   "functions": {
        echo     "app/^(chat^)/api/chat/[id]/stream/route.ts": {
        echo       "maxDuration": 300
        echo     },
        echo     "app/^(chat^)/api/audio/generate/route.ts": {
        echo       "maxDuration": 300
        echo     }
        echo   },
        echo   "env": {
        echo     "NODE_ENV": "production"
        echo   }
        echo }
    ) > vercel.json
    echo ✅ Created vercel.json
)

echo.
echo 🎯 Deployment preparation completed!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your actual API keys
echo 2. Push your code to GitHub:
echo    git add .
echo    git commit -m "Prepare for production deployment"
echo    git push origin main
echo.
echo 3. Deploy to Vercel:
echo    - Option A: Use Vercel Dashboard ^(recommended^)
echo      https://vercel.com/dashboard
echo    - Option B: Use Vercel CLI:
echo      vercel --prod
echo.
echo 4. Set environment variables in Vercel Dashboard:
echo    - XAI_API_KEY
echo    - AUTH_SECRET
echo    - POSTGRES_URL ^(if using PostgreSQL^)
echo.
echo 📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md
echo.
pause
