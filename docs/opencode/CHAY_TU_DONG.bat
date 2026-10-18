@echo off
setlocal
title Kho Bau Auto Runner
cd /d "%~dp0..\.."
echo ============================================================
echo   KHO BAU AUTO RUNNER - hang doi task cho OpenCode
echo   Chay lan luot cac file trong docs\opencode\queue\ roi cho viec moi.
echo   Trang thai : docs\opencode\TRANG_THAI.md
echo   Dung       : DUNG_LAI.bat (sau task dang lam) hoac dong cua so nay
echo   Tat han    : TAT_TU_DONG.bat
echo ============================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-all.ps1" %*
echo.
echo Runner da dung. Xem docs\opencode\TRANG_THAI.md
pause
