@echo off
setlocal
title Kho Bau Auto Runner - luong B
set "LANEB=%~dp0..\..\..\kho_bau_luong_b"
if not exist "%LANEB%\docs\opencode\run-all.ps1" (
  echo Khong tim thay thu muc luong B: %LANEB%
  pause
  exit /b 1
)
cd /d "%LANEB%"
echo ============================================================
echo   KHO BAU AUTO RUNNER - LUONG B (chay song song voi luong chinh)
echo   Thu muc   : %CD%
echo   Cau hinh  : docs\opencode\state\lane.txt (trong thu muc luong B)
echo   Model     : docs\opencode\state\model.txt (trong thu muc luong B)
echo   Trang thai: kho_bau_tri_thuc\docs\opencode\TRANG_THAI_LUONG_B.md
echo   Dung      : DUNG_LAI.bat (dung ca 2 luong sau task dang lam)
echo ============================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LANEB%\docs\opencode\run-all.ps1" %*
echo.
echo Luong B da dung.
pause
