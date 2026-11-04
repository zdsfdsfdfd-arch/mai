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
    [switch]$SetHome
)
$ErrorActionPreference = 'Continue'
$scripts = $PSScriptRoot
$root = Split-Path -Parent $scripts
Write-Host "ClearTV: диагностика телевизора, установка и проверка." -ForegroundColor Cyan
Write-Host "Телевизор и этот компьютер должны быть в одной сети, на телевизоре включена отладка по сети (ADB)."
Write-Host "Главный экран телевизора этот запуск НЕ меняет."
Write-Host ""
if (-not $Ip) { $Ip = Read-Host "IP-адрес телевизора (Настройки -> Сеть), например 192.168.1.50" }
$Ip = $Ip.Trim()
if (-not $Ip) { Write-Host "IP не указан." -ForegroundColor Red; exit 1 }

$steps = @(
    @{ Name = 'Диагностика'; File = 'diagnose.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } },
    @{ Name = 'Установка ClearTV'; File = 'install.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } },
    @{ Name = 'Проверка на телевизоре'; File = 'verify.ps1'; Params = @{ Ip = $Ip; AutoInstallTools = $true } }
)
if ($SetHome) { $steps += @{ Name = 'Назначение главным экраном'; File = 'install.ps1'; Params = @{ Ip = $Ip; SetHome = $true; NoLaunch = $true; Yes = $true } } }

$summary = @()
foreach ($s in $steps) {
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
