@echo off
chcp 65001 > nul
title Tắt máy chủ ProjectM ngầm

echo ==========================================================
echo        DỪNG TIẾN TRÌNH PROJECTM CHẠY NGẦM
echo ==========================================================
echo.
echo Đang tìm và tắt tiến trình cổng 3000...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a > nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo [THÀNH CÔNG] Đã tắt hoàn toàn máy chủ ProjectM trên cổng 3000.
) else (
    echo [THÔNG BÁO] Không có máy chủ ProjectM nào đang chạy trên cổng 3000.
)

echo.
timeout /t 2 > nul
exit

