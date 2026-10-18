@echo off
if not exist "%~dp0state" mkdir "%~dp0state"
echo stop> "%~dp0state\STOP"
set "LANEB=%~dp0..\..\..\kho_bau_luong_b\docs\opencode\state"
if exist "%LANEB%" echo stop> "%LANEB%\STOP"
echo Da gui yeu cau DUNG. Ca 2 luong runner se dung sau khi task dang lam xong.
echo Muon dung ngay: dong cua so "Kho Bau Auto Runner" (va "... luong B").
pause
