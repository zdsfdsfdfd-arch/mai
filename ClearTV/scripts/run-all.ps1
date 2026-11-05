<#
.SYNOPSIS
  ClearTV — всё одной командой: диагностика телевизора, установка, проверка, упаковка отчётов в zip.
.DESCRIPTION
  Запускается у телевизора (ПК и ТВ в одной сети, на ТВ включена отладка по сети). Выполняет по очереди
  diagnose.ps1 -> install.ps1 -> verify.ps1; каждый шаг продолжается даже при ошибке предыдущего, чтобы отчёты
  были всегда. В конце папка reports\ упаковывается в ClearTV-reports-<дата>.zip рядом с проектом.
  Главный экран НЕ меняется (для этого отдельно install.ps1 -SetHome после просмотра отчётов).
.PARAMETER Ip
  IP-адрес телевизора. Если не задан, будет запрошен.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [switch]$Full,
    [switch]$NoDownload,
    [switch]$RemoveOtherApps,
    [switch]$SafeOnly,
    [switch]$Yes
)
$ErrorActionPreference = 'Continue'
$scripts = $PSScriptRoot
$root = Split-Path -Parent $scripts
Write-Host "ClearTV: диагностика телевизора, установка и проверка." -ForegroundColor Cyan
Write-Host "Телевизор и этот компьютер должны быть в одной сети, на телевизоре включена отладка по сети (ADB)."
if ($Full) { Write-Host "Режим: полная настройка (главный экран, защита, заставка, отключение рекламы Сбера)." } elseif ($SafeOnly) { Write-Host "Режим: только диагностика, установка и проверка. Главный экран не меняется." } else { Write-Host "Сначала диагностика, установка и проверка; затем будет предложена полная настройка." }
Write-Host ""
if (-not $Ip) { $Ip = Read-Host "IP-адрес телевизора (Настройки -> Сеть), например 192.168.1.50" }
$Ip = $Ip.Trim()
if (-not $Ip) { Write-Host "IP не указан." -ForegroundColor Red; exit 1 }

$steps = @(
    @{ Name = 'Диагностика'; File = 'diagnose.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } },
    @{ Name = 'Установка ClearTV'; File = 'install.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } }
)
$appsDir = Join-Path $root 'apps'
if (-not $NoDownload) { $steps += @{ Name = 'Загрузка приложений владельца (официальные источники)'; File = 'get-apps.ps1'; Params = @{ Ip = $Ip; Yes = $true } } }
$steps += @{ Name = 'Установка приложений из папки apps'; File = 'install-apps.ps1'; Params = @{ Ip = $Ip; Yes = $true }
             Condition = { @(Get-ChildItem $appsDir -Filter '*.apk' -Recurse -File -ErrorAction SilentlyContinue).Count -gt 0 }; SkipText = 'в папке apps нет APK — пропущено' }
$steps += @{ Name = 'Проверка на телевизоре'; File = 'verify.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } }

$summary = @()
foreach ($s in $steps) {
    if ($s.Condition -and -not (& $s.Condition)) { $summary += "{0}: {1}" -f $s.Name, $s.SkipText; continue }
    Write-Host ""
    Write-Host ("#" * 70) -ForegroundColor Cyan
    Write-Host ("# " + $s.Name) -ForegroundColor Cyan
    Write-Host ("#" * 70) -ForegroundColor Cyan
    $started = Get-Date
    try {
        $stepParams = $s.Params
        & (Join-Path $scripts $s.File) @stepParams
        $summary += "{0}: выполнено ({1} с)" -f $s.Name, [int]((Get-Date) - $started).TotalSeconds
    } catch {
        Write-Host ("Шаг '" + $s.Name + "' завершился с ошибкой: " + $_.Exception.Message) -ForegroundColor Red
        $summary += "{0}: ОШИБКА — {1}" -f $s.Name, $_.Exception.Message
    }
}

# ------------------------------------------------------------------ full setup (home screen, guard, screensaver, Sber ads off)
$reportsDir = if ($env:CLEARTV_REPORTS_DIR) { $env:CLEARTV_REPORTS_DIR } else { Join-Path $root 'reports' }
$verifyOk = $false
try {
    $vr = Get-Content (Join-Path $reportsDir 'verify-report.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $must = @('installed', 'cold_start', 'dpad_navigation')
    $verifyOk = (@($vr.Results | Where-Object { $_.Test -in $must -and $_.Status -eq 'PASS' }).Count -eq $must.Count)
} catch { }
$doFull = $Full
if (-not $Full -and -not $SafeOnly) {
    Write-Host ""
    if ($verifyOk) {
        Write-Host "Базовая проверка пройдена. Полная настройка сделает ClearTV главным экраном, включит защиту от возврата" -ForegroundColor Cyan
        Write-Host "лаунчера Сбера, заставку ClearTV и отключит рекламу/телеметрию Сбера (только отключение, откат — restore.ps1)." -ForegroundColor Cyan
        $answer = if ($Yes) { 'y' } else { Read-Host "Выполнить полную настройку? [y/N]" }
        $doFull = ($answer -match '^[yYдД]')
    } else {
        Write-Host "Базовая проверка не пройдена полностью — полная настройка пропущена (см. отчёт verify-report.md)." -ForegroundColor Yellow
    }
}
if ($doFull) {
    if (-not $verifyOk) {
        Write-Host "Полная настройка запрошена, но базовая проверка (installed/cold_start/dpad_navigation) не пройдена — отказ. Пришлите отчёты." -ForegroundColor Red
        $summary += "Полная настройка: пропущена (проверка не пройдена)"
    } else {
        $fullSteps = @(
            @{ Name = 'Главный экран ClearTV'; File = 'install.ps1'; Params = @{ Ip = $Ip; SetHome = $true; NoLaunch = $true; Yes = $true } },
            @{ Name = 'Очистка Сбера, защита, заставка'; File = 'clean.ps1'; Params = @{ Ip = $Ip; Mode = 'Recommended'; BlockOverlays = $true; Screensaver = $true; HomeGuard = $true; LowerStorageThreshold = $true; RemoveOtherApps = [bool]$RemoveOtherApps; Yes = $true } }
        )
        foreach ($s in $fullSteps) {
            Write-Host ""; Write-Host ("#" * 70) -ForegroundColor Cyan; Write-Host ("# " + $s.Name) -ForegroundColor Cyan; Write-Host ("#" * 70) -ForegroundColor Cyan
            $started = Get-Date
            try { $stepParams = $s.Params; & (Join-Path $scripts $s.File) @stepParams; $summary += "{0}: выполнено ({1} с)" -f $s.Name, [int]((Get-Date) - $started).TotalSeconds }
            catch { Write-Host ("Шаг '" + $s.Name + "' завершился с ошибкой: " + $_.Exception.Message) -ForegroundColor Red; $summary += "{0}: ОШИБКА — {1}" -f $s.Name, $_.Exception.Message }
        }
    }
}

Write-Host ""
Write-Host "== Упаковка отчётов" -ForegroundColor Cyan
$reports = if ($env:CLEARTV_REPORTS_DIR) { $env:CLEARTV_REPORTS_DIR } else { Join-Path $root 'reports' }
$zip = Join-Path (Split-Path -Parent $reports) ("ClearTV-reports-" + (Get-Date -Format 'yyyyMMdd-HHmm') + ".zip")
try {
    $summaryPath = Join-Path $reports 'run-all-summary.txt'
    Set-Content -Path $summaryPath -Value (($summary + "", "ПК: $([System.Environment]::MachineName), PowerShell $($PSVersionTable.PSVersion), $(Get-Date)") -join "`n") -Encoding UTF8
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Compress-Archive -Path (Join-Path $reports '*') -DestinationPath $zip -Force
    Write-Host "Отчёты упакованы: $zip" -ForegroundColor Green
} catch {
    Write-Host ("Не удалось упаковать отчёты: " + $_.Exception.Message + ". Отправьте папку " + $reports + " целиком.") -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Итог:" -ForegroundColor Cyan
$summary | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Отправьте файл $zip тому, кто ведёт проект." -ForegroundColor Green
