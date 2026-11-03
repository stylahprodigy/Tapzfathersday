@echo off
title Push Sports Edge AI to GitHub (tapzfathersday.org)
color 0b
cd /d "D:\AA STYLXH STUDIOS\DADS BIRTHDAY GIFT"
cls
echo ==============================================================================
echo   SPORTS EDGE AI TERMINAL v2.0 -- GITHUB SYNC & CLOUDFLARE DEPLOY
echo ==============================================================================
echo.
echo Target Repository : https://github.com/stylahprodigy/Tapzfathersday.git
echo Target Domain     : https://tapzfathersday.org
echo Authorized User   : tapz.latunipulu@gmail.com
echo.
echo Connecting to GitHub...
echo If a GitHub sign-in window opens, click "Sign in with your browser"
echo and authorize stylahprodigy.
echo.
echo ------------------------------------------------------------------------------
git push -u origin main
echo ------------------------------------------------------------------------------
echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo [SUCCESS] All files and edge worker pushed to GitHub!
    echo Cloudflare is now deploying Sports Edge AI to tapzfathersday.org.
    echo.
    echo You can verify at: https://tapzfathersday.org
) else (
    color 0c
    echo [WARNING] Git push encountered an authentication issue.
    echo If you have a GitHub Personal Access Token (PAT), you can paste it when prompted.
)
echo.
echo Press any key to exit...
pause >nul

