@echo off
title GitHub Sign-In and Deploy (tapzfathersday.org)
color 0b
cd /d "D:\AA STYLXH STUDIOS\DADS BIRTHDAY GIFT"
cls
echo ==============================================================================
echo   GITHUB SIGN-IN & DEPLOY FOR TAPZFATHERSDAY.ORG
echo ==============================================================================
echo.
echo Target Account    : stylahprodigy
echo Target Repository : https://github.com/stylahprodigy/Tapzfathersday.git
echo.
echo Step 1: Authorizing GitHub via Browser...
echo A browser window will open. Confirm the one-time code to authorize.
echo.
gh auth login -h github.com -p https -w
echo.
echo Step 2: Configuring Git to use GitHub authorization...
gh auth setup-git
echo.
echo Step 3: Pushing Sports Edge AI Bet Terminal to main branch...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo ==============================================================================
    echo [SUCCESS] PUSH COMPLETED!
    echo Cloudflare is now compiling and deploying to https://tapzfathersday.org
    echo ==============================================================================
) else (
    echo [INFO] If git push asked for credentials, you can also run Push_To_GitHub.bat.
)
echo.
echo Press any key to finish...
pause >nul

