@echo off
title ClearTV - apps
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-apps.ps1" %*
echo.
pause
