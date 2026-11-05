<#
.SYNOPSIS
  ClearTV — установка приложений из папки apps\ (APK-файлы, которые вы положили туда сами).
.DESCRIPTION
  Каждый *.apk из папки (и подпапок) устанавливается командой adb install -r -t. Файлы проект не скачивает:
  положите в apps\ установщики из официальных источников. Установленное записывается в журнал операций
  (без автоматического отката: это приложения владельца). ClearTV добавит новые приложения на главный экран сам,
  пока порядок ряда автоматический (список предпочтений — scripts\data\preferred-apps.json).
.PARAMETER Folder
  Папка с APK (по умолчанию ..\apps относительно scripts\).
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [string]$Folder,
    [switch]$Yes,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

if (-not $Folder) { $Folder = Join-Path (Split-Path -Parent $PSScriptRoot) 'apps' }
$apks = @(Get-ChildItem $Folder -Filter '*.apk' -Recurse -File -ErrorAction SilentlyContinue | Sort-Object FullName)
if ($apks.Count -eq 0) { Write-Info "В папке $Folder нет APK-файлов — устанавливать нечего."; return }
Write-Info "Найдено APK: $($apks.Count) в $Folder"
if (-not $Ip -and -not $Serial) { $Ip = (Read-Host "IP-адрес телевизора (Настройки -> Сеть), например 192.168.1.50").Trim() }

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
Write-Ok "Устройство: $serial ($(Get-Prop 'ro.product.model'), API $(Get-Prop 'ro.build.version.sdk'))"

$installed = 0; $failed = 0
$before = @((ConvertFrom-PackageList (Get-ShellText 'pm list packages -3')) | ForEach-Object { $_.Package })
foreach ($apk in $apks) {
    Write-Step "Установка $($apk.Name) ($([math]::Round($apk.Length / 1MB, 1)) МБ)"
    $r = Invoke-Adb install -r -t $apk.FullName
    $out = (([string]$r.Output) -replace "`r?`n", ' ').Trim()
    if ($out -match 'Success') {
        $after = @((ConvertFrom-PackageList (Get-ShellText 'pm list packages -3')) | ForEach-Object { $_.Package })
        $new = @($after | Where-Object { $before -notcontains $_ })
        $before = $after
        $pkg = ($new -join ',')
        Add-JournalEntry -Action 'install-app' -Description "Установлено приложение владельца из apps\: $($apk.Name)$(if ($pkg) { " ($pkg)" })" -Command "adb install -r -t $($apk.Name)" -RestoreCommand '' -Previous '' -New $pkg -Verify $(if ($pkg) { "pm path $pkg" } else { '' }) | Out-Null
        Write-Ok "Установлено$(if ($pkg) { ": $pkg" } else { ' (обновление уже стоявшего приложения)' })"
        $installed++
    } else {
        $hint = ''
        if ($out -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') { $hint = ' — на телевизоре стоит версия с другой подписью; удалите её через Настройки → Приложения и повторите' }
        elseif ($out -match 'INSTALL_FAILED_NO_MATCHING_ABIS') { $hint = ' — сборка не для этого процессора (нужна armeabi-v7a/arm64-v8a)' }
        elseif ($out -match 'INSTALL_FAILED_OLDER_SDK') { $hint = ' — приложению нужна более новая версия Android' }
        elseif ($out -match 'INSTALL_FAILED_INSUFFICIENT_STORAGE') { $hint = ' — мало места на телевизоре' }
        Write-Fail "Не установлено: $($apk.Name) — $out$hint"
        $failed++
    }
}
Write-Step "Готово"
Write-Info "Установлено: $installed, ошибок: $failed. Журнал: reports\operations-journal.json"
if ($installed -gt 0) { Write-Info "ClearTV покажет новые приложения на главном экране сам (автоматический порядок; список предпочтений — scripts\data\preferred-apps.json)." }
