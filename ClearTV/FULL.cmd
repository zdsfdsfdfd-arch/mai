@echo off
title ClearTV - full setup
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-all.ps1" -Full %*
echo.
pause
