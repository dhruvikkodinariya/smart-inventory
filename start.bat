@echo off
title StockSense - Smart Inventory System
color 0A

echo.
echo  ========================================
echo   StockSense - Smart Inventory System
echo  ========================================
echo.

:: Check if .env exists
if not exist ".env" (
    echo  [ERROR] .env file not found!
    echo  Please copy .env.example to .env and fill in your Firebase credentials.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo  [INFO] Installing dependencies...
    "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
    echo.
)

echo  [OK] Starting StockSense server...
echo  [OK] Open browser at: http://localhost:5000
echo.
echo  Press Ctrl+C to stop the server.
echo.

"C:\Program Files\nodejs\node.exe" server/index.js
pause
