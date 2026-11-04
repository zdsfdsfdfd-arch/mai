<#
.SYNOPSIS
  ClearTV — отключение рекламы, телеметрии и мусора Сбера на Салют ТВ. Только `pm disable-user` (обратимо),
  с проверкой состояния телевизора после каждого пакета и записью отката в журнал.
.DESCRIPTION
  План строится из инвентаризации устройства (структурные признаки + база знаний scripts\data\salute-packages.json,
  подтверждённая отчётами с реальных Салют ТВ). Никогда не трогаются: CRITICAL и UNKNOWN, текущий главный экран,
  штатный лаунчер Сбера (его отключение уводит часть прошивок в recovery), клавиатура, входы, ассистент, ClearTV.
.PARAMETER Mode
  Recommended — только PROMOTIONAL (реклама, телеметрия, мусор). Max — плюс сервисы Сбера «по желанию» (OPTIONAL
  из базы знаний: СберTube, Видео, Музыка, магазин и т.п.; каждый показывается с тем, что перестанет работать).
.PARAMETER Include
  Дополнительные пакеты (только из OPTIONAL/PROMOTIONAL инвентаризации).
.PARAMETER Exclude
  Пакеты, которые не трогать даже если они в плане.
.PARAMETER BlockOverlays
  Запретить службе Сбера рисовать полноэкранные промо поверх всего (appops SYSTEM_ALERT_WINDOW deny). Побочный
  эффект: визуальные карточки голосового ассистента не показываются, голос работает. Откат — прежний режим.
.PARAMETER Screensaver
  Сделать заставкой ClearTV (часы на обоях) вместо заставки Сбера с рекламой. Выполняется ДО отключения пакетов:
  пока заставка Сбера остаётся выбранной, StarOS включает её обратно при загрузке. Откат — прежнее значение.
.PARAMETER HomeGuard
  Включить службу спец. возможностей ClearTV, возвращающую главный экран, если прошивка показала свой лаунчер.
.PARAMETER LowerStorageThreshold
  StarOS удаляет («ротирует») сторонние приложения, когда на /data остаётся меньше ~355 МБ (порог Android 5 % +
  200 МБ Сбера). Ставит sys_storage_threshold_percentage=1, чтобы ClearTV не попал под ротацию. Откат — удаление ключа.
.PARAMETER DisableAutoUpdates
  Выключить автообновления прошивки и приложений (ota_disable_automatic_update=1, auto_update_apps=0).
  По умолчанию выключено: обновления прошивки должны продолжать работать. Откат — прежние значения.
.PARAMETER DryRun
  Только показать план и записать reports\clean-plan.md, ничего не менять.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [ValidateSet('Recommended', 'Max')][string]$Mode = 'Recommended',
    [string[]]$Include = @(),
    [string[]]$Exclude = @(),
    [switch]$BlockOverlays,
    [switch]$Screensaver,
    [switch]$HomeGuard,
    [switch]$LowerStorageThreshold,
    [switch]$DisableAutoUpdates,
    [switch]$DryRun,
    [switch]$Yes,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
$model = Get-Prop 'ro.product.model'; $api = Get-Prop 'ro.build.version.sdk'
Write-Ok "Устройство: $serial ($model, API $api)"
$stamp = Get-Timestamp

Write-Step "Инвентаризация"
$inv = Get-DeviceInventory
$rows = @($inv.Packages)
$homeNow = Get-ResolvedHome
$kb = (Get-KnowledgeBase).Raw
$platformDetected = @($kb.platform.detect_packages | Where-Object { $rows.Package -contains $_ }).Count -gt 0
Write-Info "Пакетов: $($rows.Count); текущий HOME: $homeNow; платформа Салют ТВ распознана: $platformDetected"
Write-JsonFile (Join-Path $ReportsDir 'inventory.json') $rows
Write-Utf8File (Join-Path $ReportsDir 'inventory.md') (Format-InventoryMarkdown $inv "$model (API $api)")
$df = Get-ShellText 'df /data'
$freeMb = $null
if ($df -match '(?m)^\S+\s+(\d+)\s+(\d+)\s+(\d+)') { $freeMb = [math]::Round([long]$Matches[3] / 1024); Write-Info "Свободно на /data: $freeMb МБ (StarOS удаляет сторонние приложения примерно ниже 355 МБ)" }
if ($null -ne $freeMb -and $freeMb -lt 450 -and -not $LowerStorageThreshold) { Write-Warn "Мало места: добавьте -LowerStorageThreshold и освободите место (Настройки → Приложения), иначе ClearTV может быть удалён «ротацией»" }

# ------------------------------------------------------------------ plan
$wifiOwners = @([regex]::Matches((Get-ShellText "dumpsys wifi"), 'cname=([^\s]+)') | ForEach-Object { $_.Groups[1].Value })
$homePkg = if ($homeNow) { ($homeNow -split '/')[0] } else { '' }
function Test-NeverTouch($row) {
    if ($row.Package -eq $PackageName) { return 'ClearTV' }
    if ($row.Category -eq 'CRITICAL' -or $row.Category -eq 'UNKNOWN') { return $row.Category }
    if ($row.Package -eq $homePkg) { return 'текущий HOME' }
    if ($wifiOwners -contains $row.Package) { return 'владеет сохранённой сетью Wi-Fi' }
    if ($row.Enabled -match 'disabled') { return 'уже отключён' }
    return $null
}
$plan = @()
foreach ($row in $rows) {
    $why = ''
    if ($row.Category -eq 'PROMOTIONAL') { $why = 'реклама/телеметрия/мусор (подтверждено отчётами)' }
    elseif ($Mode -eq 'Max' -and $row.Category -eq 'OPTIONAL' -and $row.Known) { $why = 'сервис Сбера по желанию (режим Max)' }
    elseif ($Include -contains $row.Package -and $row.Category -in @('OPTIONAL', 'PROMOTIONAL', 'PROMOTIONAL-CANDIDATE')) { $why = 'указан в -Include' }
    if (-not $why) { continue }
    if ($Exclude -contains $row.Package) { continue }
    $block = Test-NeverTouch $row
    if ($block) { Write-Info "пропуск $($row.Package): $block"; continue }
    if (-not $row.DisableCommand -or $row.DisableCommand -notmatch '^pm disable-user') { continue }   # only reversible disable
    $plan += [pscustomobject]@{ Package = $row.Package; Known = $row.Known; Why = $why; Breaks = $row.Breaks; Command = $row.DisableCommand; Restore = $row.RestoreCommand }
}
foreach ($i in $Include) { if ($rows.Package -notcontains $i) { Write-Warn "-Include ${i}: пакет не установлен" } elseif ($plan.Package -notcontains $i) { Write-Warn "-Include ${i}: не входит в OPTIONAL/PROMOTIONAL, не трогаю" } }

$extras = @()
$overlayPkg = [string]$kb.platform.overlay_package
if ($Screensaver) { $extras += "Заставка: screensaver_components -> $ClearTvDream (выполняется до отключения пакетов)" }
if ($BlockOverlays) { if ($rows.Package -contains $overlayPkg) { $extras += "Запрет промо-оверлея: appops set $overlayPkg SYSTEM_ALERT_WINDOW deny (карточки ассистента не будут показываться)" } else { Write-Warn "-BlockOverlays: пакет $overlayPkg не найден, пропуск" } }
if ($HomeGuard) { $extras += "Защита главного экрана: enabled_accessibility_services += $ClearTvGuard" }
if ($LowerStorageThreshold) { $extras += "Порог нехватки места: sys_storage_threshold_percentage=1 (защита от «ротации» приложений StarOS)" }
if ($DisableAutoUpdates) { $extras += "Автообновления: ota_disable_automatic_update=1, auto_update_apps=0 (прошивка перестанет обновляться сама!)" }

Write-Step "План ($Mode): отключить $($plan.Count) пакет(ов)"
foreach ($p in $plan) { Write-Info ("{0,-42} {1}{2}" -f $p.Package, $(if ($p.Known) { $p.Known } else { $p.Why }), $(if ($p.Breaks) { " — перестанет: $($p.Breaks)" } else { '' })) }
foreach ($e in $extras) { Write-Info "+ $e" }
$planMd = New-Object System.Text.StringBuilder
[void]$planMd.AppendLine("# План очистки — $model ($(Get-Date -Format 'yyyy-MM-dd HH:mm'), режим $Mode)")
[void]$planMd.AppendLine("")
[void]$planMd.Append((ConvertTo-MarkdownTable $plan @('Package', 'Known', 'Why', 'Breaks', 'Command', 'Restore')))
[void]$planMd.AppendLine("")
foreach ($e in $extras) { [void]$planMd.AppendLine("- $e") }
Write-Utf8File (Join-Path $ReportsDir 'clean-plan.md') $planMd.ToString()
if ($plan.Count -eq 0 -and $extras.Count -eq 0) { Write-Ok "Нечего делать"; return }
if ($DryRun) { Write-Ok "Пробный запуск: план записан в reports\clean-plan.md, ничего не изменено"; return }
if (-not $Yes) { $answer = Read-Host "  Выполнить? Всё обратимо через restore.ps1 [y/N]"; if ($answer -notmatch '^[yYдД]') { Write-Info "Отменено"; return } }

# ------------------------------------------------------------------ execute
$backup = New-Dir (Join-Path $BackupDir "$stamp-clean")
Write-Utf8File (Join-Path $backup 'packages-disabled-before.txt') (Get-ShellText 'pm list packages -d')
Write-Utf8File (Join-Path $backup 'home-activity.txt') "$homeNow"

if ($Screensaver) {
    Write-Step "Заставка (до отключения пакетов)"
    $prev = Get-SecureSetting 'screensaver_components'
    $prevEnabled = Get-SecureSetting 'screensaver_enabled'
    Invoke-AdbShell "settings put secure screensaver_components $ClearTvDream" | Out-Null
    Invoke-AdbShell "settings put secure screensaver_enabled 1" | Out-Null
    $now = Get-SecureSetting 'screensaver_components'
    if ($now -eq $ClearTvDream) {
        $restore = (Get-RestoreSettingCommand 'secure' 'screensaver_components' $prev) + '; ' + (Get-RestoreSettingCommand 'secure' 'screensaver_enabled' $prevEnabled)
        Add-JournalEntry -Action 'screensaver' -Description "Заставка: $prev -> ClearTV" -Command "settings put secure screensaver_components $ClearTvDream" -RestoreCommand $restore -Previous $prev -New $ClearTvDream | Out-Null
        Write-Ok "Заставка ClearTV выбрана (было: $(if ($prev) { $prev } else { 'не задано' }))"
    } else { Write-Warn "screensaver_components не изменился (сейчас: $now)" }
}

$done = @(); $failed = @()
Write-Step "Отключение"
foreach ($p in $plan) {
    $r = Invoke-AdbShell $p.Command
    if ($r.Output -match 'new state: disabled') {
        Add-JournalEntry -Action 'disable-package' -Description "Отключён $($p.Package) ($($p.Known))" -Command $p.Command -RestoreCommand $p.Restore -Previous 'enabled' -New 'disabled-user' -Verify "pm list packages -d" | Out-Null
        $problem = Test-DeviceHealth $homeNow
        if ($problem) {
            Write-Fail "$($p.Package): после отключения — $problem. Включаю обратно."
            Invoke-AdbShell $p.Restore | Out-Null
            $entries = @(Read-Journal); $last = $entries | Where-Object { $_.Action -eq 'disable-package' -and $_.Description -like "*$($p.Package)*" } | Select-Object -Last 1
            if ($last) { Set-JournalRestored $last.Id }
            $failed += "$($p.Package): $problem"
            break
        }
        Write-Ok $p.Package
        $done += $p.Package
    } else {
        Write-Warn "$($p.Package): $($r.Output -replace "`n", ' ')"
        $failed += "$($p.Package): $($r.Output)"
        if ($r.Output -match 'SecurityException') { Write-Warn "Прошивка запрещает pm disable-user для системных пакетов; остальные пакеты пропущены."; break }
    }
}

if ($BlockOverlays -and ($rows.Package -contains $overlayPkg)) {
    Write-Step "Промо-оверлей"
    $prev = (Get-ShellText "appops get $overlayPkg SYSTEM_ALERT_WINDOW").Trim()
    $prevMode = if ($prev -match 'SYSTEM_ALERT_WINDOW:\s*(\w+)') { $Matches[1] } else { 'allow' }
    $r = Invoke-AdbShell "appops set $overlayPkg SYSTEM_ALERT_WINDOW deny"
    if ($r.ExitCode -eq 0 -and $r.Output -notmatch 'Error|Exception') {
        Add-JournalEntry -Action 'appops-overlay' -Description "Запрет SYSTEM_ALERT_WINDOW для $overlayPkg" -Command "appops set $overlayPkg SYSTEM_ALERT_WINDOW deny" -RestoreCommand "appops set $overlayPkg SYSTEM_ALERT_WINDOW $prevMode" -Previous $prevMode -New 'deny' | Out-Null
        Write-Ok "Полноэкранные промо Сбера запрещены (было: $prevMode)"
    } else { Write-Warn "appops: $($r.Output)" }
}

if ($HomeGuard) {
    Write-Step "Защита главного экрана (спец. возможности)"
    $prev = Get-SecureSetting 'enabled_accessibility_services'
    $prevEnabled = Get-SecureSetting 'accessibility_enabled'
    $list = @($prev -split ':' | Where-Object { $_ -and $_ -ne $ClearTvGuard })
    $list += $ClearTvGuard
    $new = ($list -join ':')
    Invoke-AdbShell "settings put secure enabled_accessibility_services '$new'" | Out-Null
    Invoke-AdbShell "settings put secure accessibility_enabled 1" | Out-Null
    $now = Get-SecureSetting 'enabled_accessibility_services'
    if ($now -match [regex]::Escape($ClearTvGuard)) {
        $restore = (Get-RestoreSettingCommand 'secure' 'enabled_accessibility_services' $prev) + '; ' + (Get-RestoreSettingCommand 'secure' 'accessibility_enabled' $prevEnabled)
        Add-JournalEntry -Action 'home-guard' -Description "Включена служба спец. возможностей ClearTV" -Command "settings put secure enabled_accessibility_services '$new'" -RestoreCommand $restore -Previous $prev -New $new | Out-Null
        Write-Ok "Служба включена"
    } else { Write-Warn "enabled_accessibility_services не изменился (сейчас: $now)" }
}

if ($LowerStorageThreshold) {
    Write-Step "Порог нехватки места"
    $prev = Get-GlobalSetting 'sys_storage_threshold_percentage'
    Invoke-AdbShell "settings put global sys_storage_threshold_percentage 1" | Out-Null
    if ((Get-GlobalSetting 'sys_storage_threshold_percentage') -eq '1') {
        Add-JournalEntry -Action 'storage-threshold' -Description "sys_storage_threshold_percentage: $prev -> 1" -Command "settings put global sys_storage_threshold_percentage 1" -RestoreCommand (Get-RestoreSettingCommand 'global' 'sys_storage_threshold_percentage' $prev) -Previous $prev -New '1' | Out-Null
        Write-Ok "Порог снижен до 1 % (вступит в силу после перезагрузки)"
    } else { Write-Warn "настройка не применилась" }
}

if ($DisableAutoUpdates) {
    Write-Step "Автообновления"
    $prevOta = Get-GlobalSetting 'ota_disable_automatic_update'; $prevApps = Get-GlobalSetting 'auto_update_apps'
    Invoke-AdbShell "settings put global ota_disable_automatic_update 1" | Out-Null
    Invoke-AdbShell "settings put global auto_update_apps 0" | Out-Null
    $restore = (Get-RestoreSettingCommand 'global' 'ota_disable_automatic_update' $prevOta) + '; ' + (Get-RestoreSettingCommand 'global' 'auto_update_apps' $prevApps)
    Add-JournalEntry -Action 'auto-updates' -Description "Автообновления выключены" -Command "settings put global ota_disable_automatic_update 1; settings put global auto_update_apps 0" -RestoreCommand $restore -Previous "ota=$prevOta apps=$prevApps" -New 'ota=1 apps=0' | Out-Null
    Write-Warn "Автообновления прошивки и приложений выключены. Откат: restore.ps1"
}

# ------------------------------------------------------------------ report
$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Очистка — $model ($(Get-Date -Format 'yyyy-MM-dd HH:mm'), режим $Mode)")
[void]$md.AppendLine("")
[void]$md.AppendLine("Отключено: $($done.Count) из $($plan.Count). Все команды и откат — в ``reports/operations-journal.json``; вернуть всё: ``restore.ps1``.")
[void]$md.AppendLine("")
foreach ($d in $done) { [void]$md.AppendLine("- отключён ``$d``") }
foreach ($f in $failed) { [void]$md.AppendLine("- не удалось: $f") }
foreach ($e in $extras) { [void]$md.AppendLine("- $e") }
if ($null -ne $freeMb) { [void]$md.AppendLine("- свободно на /data до очистки: $freeMb МБ") }
[void]$md.AppendLine("")
[void]$md.AppendLine("Проверьте после перезагрузки: пульт, звук, HDMI-входы, Wi‑Fi, голосовой ассистент. Если что-то перестало работать — ``restore.ps1``.")
Write-Utf8File (Join-Path $ReportsDir 'clean-report.md') $md.ToString()
Write-Step "Готово"
Write-Ok "Отключено: $($done.Count); отчёт reports\clean-report.md; откат restore.ps1"
