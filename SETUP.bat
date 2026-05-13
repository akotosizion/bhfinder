@echo off
echo.
echo  =========================================
echo   BH FINDER — Setup Script
echo  =========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed. Make sure Node.js is installed.
  pause
  exit /b 1
)

echo.
echo [2/4] Setting up Neon database (schema + admin seed)...
call npm run db:setup
if errorlevel 1 (
  echo ERROR: Database setup failed. Check your .env.local DATABASE_URL.
  pause
  exit /b 1
)

echo.
echo [3/4] Initializing Git repository...
git init
git add .
git commit -m "Initial commit: BH Finder full-stack app"
echo.
echo  *** IMPORTANT: Create a GitHub repo then run: ***
echo  git remote add origin https://github.com/akotosizion/bhfinder.git
echo  git push -u origin main
echo.

echo [4/4] Starting development server...
echo.
echo  App running at: http://localhost:3000
echo  Admin login:    admin@bhfinder.com / admin123
echo.
call npm run dev
