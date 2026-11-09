@echo off
chcp 65001 > nul
title ProjectM - Phần mềm Quản lý Dự án ĐTXD
echo ==========================================================
echo        PROJECTM - QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG
echo ==========================================================
echo.
echo Đang khởi động hệ thống và mở giao diện phần mềm...
echo.
start "" "http://localhost:3030"
npm run dev
pause

