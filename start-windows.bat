@echo off
title vMix Web Controller
color 0e

echo =========================================
echo       vMix Web Controller Setup       
echo =========================================
echo.

WHERE node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js (LTS version) from https://nodejs.org/
    echo Once installed, double click this file again.
    echo.
    pause
    exit
)

IF NOT EXIST "node_modules\" (
    echo [*] First time setup. Installing dependencies...
    echo [*] This might take a minute depending on your internet connection.
    call npm install
)

echo.
echo [*] Starting the web server...
echo [*] Your default browser will open automatically.
echo [*] Keep this DOS window open while using the controller!
echo [*] To stop, press Ctrl+C in this window.
echo.

:: We use npx to run vite directly on port 3000 and open the browser automatically
call npx vite --port 3000 --open

pause
