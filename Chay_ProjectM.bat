@echo off
title ProjectM - May chu He thong
cd /d "%~dp0"

echo ==========================================================
echo        PROJECTM - QUAN LY DU AN DAU TU XAY DUNG
echo ==========================================================
echo.

rem 1. Kiem tra xem may chu cong 3030 da chay chua
netstat -ano | findstr ":3030" | findstr "LISTENING" > nul
if %errorlevel% equ 0 (
    echo [THONG BAO] May chu he thong da san sang!
    echo Dang mo ung dung ProjectM...
    goto open_browser
)

rem 2. Hen gio tu dong mo trinh duyet sau 2 giay khi may chu khoi dong
start "" cmd /c "ping 127.0.0.1 -n 3 > nul && (if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3030) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3030) else (start "" http://localhost:3030))"

rem 3. Khoi chay may chu he thong
echo Dang khoi dong may chu he thong tren cong 3030...
node "%~dp0start-server.mjs"
goto end

:open_browser
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3030
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3030
) else (
    start "" "http://localhost:3030"
)

:end
