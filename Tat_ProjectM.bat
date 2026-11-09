@echo off
title ProjectM - Tat may chu
cd /d "%~dp0"

echo ==========================================================
echo        DUNG TIEN TRINH PROJECTM HE THONG
echo ==========================================================
echo.
echo Dang tim va tat tien trinh tren cong 3030...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3030" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a > nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo [THANH CONG] Da tat may chu ProjectM tren cong 3030.
) else (
    echo [THONG BAO] Khong co may chu ProjectM nao dang chay tren cong 3030.
)

echo Cua so se tu dong dong sau 2 giay...
ping 127.0.0.1 -n 3 > nul
exit
