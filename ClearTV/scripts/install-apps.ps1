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
$apks = @(Get-ChildItem $Folder -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in @('.apk', '.apkm', '.xapk', '.apks') } | Sort-Object FullName)
if ($apks.Count -eq 0) { Write-Info "В папке $Folder нет APK-файлов — устанавливать нечего."; return }
Write-Info "Найдено APK: $($apks.Count) в $Folder"
if (-not $Ip -and -not $Serial) { $Ip = (Read-Host "IP-адрес телевизора (Настройки -> Сеть), например 192.168.1.50").Trim() }

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
Write-Ok "Устройство: $serial ($(Get-Prop 'ro.product.model'), API $(Get-Prop 'ro.build.version.sdk'))"

$installed = 0; $failed = 0
$before = @((ConvertFrom-PackageList (Get-ShellText 'pm list packages -3')) | ForEach-Object { $_.Package })
$abis = @(((Get-Prop 'ro.product.cpu.abilist') -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$abiTags = @($abis | ForEach-Object { $_ -replace '-', '_' })
$densityDpi = 0; if ((Get-ShellText 'wm density') -match 'density:\s*(\d+)') { $densityDpi = [int]$Matches[1] }
$dpiTag = if ($densityDpi -le 120) { 'ldpi' } elseif ($densityDpi -le 160) { 'mdpi' } elseif ($densityDpi -le 213) { 'tvdpi' } elseif ($densityDpi -le 240) { 'hdpi' } elseif ($densityDpi -le 320) { 'xhdpi' } elseif ($densityDpi -le 480) { 'xxhdpi' } else { 'xxxhdpi' }
$lang = ((Get-Prop 'ro.product.locale') -split '[-_]')[0]; if (-not $lang) { $lang = 'ru' }
function Select-BundleSplits([string]$Dir) {
    # base + the splits that fit this TV; other ABIs/densities/languages are left out (install-multiple rejects duplicates)
    $all = @(Get-ChildItem $Dir -Recurse -File -Filter '*.apk')
    $base = $all | Where-Object { $_.Name -eq 'base.apk' } | Select-Object -First 1
    if (-not $base) { $base = $all | Where-Object { $_.Name -notmatch '^split_|config\.' } | Sort-Object Length -Descending | Select-Object -First 1 }
    if (-not $base) { return @() }
    $chosen = @($base.FullName)
    foreach ($f in $all) {
        if ($f.FullName -eq $base.FullName) { continue }
        $n = $f.Name
        if ($n -match '(?i)config\.(armeabi_v7a|arm64_v8a|x86_64|x86)\.apk$') { if ($abiTags -contains $Matches[1]) { $chosen += $f.FullName }; continue }
        if ($n -match '(?i)config\.(ldpi|mdpi|tvdpi|hdpi|xhdpi|xxhdpi|xxxhdpi)\.apk$') { if ($Matches[1] -eq $dpiTag) { $chosen += $f.FullName }; continue }
        if ($n -match '(?i)config\.([a-z]{2})\.apk$') { if ($Matches[1] -in @($lang, 'en')) { $chosen += $f.FullName }; continue }
        $chosen += $f.FullName
    }
    return $chosen
}
foreach ($apk in $apks) {
    Write-Step "Установка $($apk.Name) ($([math]::Round($apk.Length / 1MB, 1)) МБ)"
    if ($apk.Extension -in @('.apkm', '.xapk', '.apks')) {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) ("cleartv-bundle-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
        New-Item -ItemType Directory -Path $tmp -Force | Out-Null
        $zipCopy = Join-Path $tmp 'bundle.zip'; Copy-Item $apk.FullName $zipCopy
        try { Expand-Archive -Path $zipCopy -DestinationPath (Join-Path $tmp 'x') -Force } catch { Write-Fail "Не распаковался бандл $($apk.Name): $($_.Exception.Message)"; $failed++; continue }
        $parts = @(Select-BundleSplits (Join-Path $tmp 'x'))
        if ($parts.Count -eq 0) { Write-Fail "В бандле $($apk.Name) нет base.apk"; $failed++; continue }
        Write-Info ("Бандл: ставлю " + (($parts | ForEach-Object { Split-Path -Leaf $_ }) -join ', ') + " (ABI $($abis -join '/'), $dpiTag, $lang)")
        $r = Invoke-Adb install-multiple -r -t @parts
        $cmdText = "adb install-multiple -r -t $($apk.Name)"
        Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        $r = Invoke-Adb install -r -t $apk.FullName
        $cmdText = "adb install -r -t $($apk.Name)"
    }
    $out = (([string]$r.Output) -replace "`r?`n", ' ').Trim()
    if ($out -match 'Success') {
        $after = @((ConvertFrom-PackageList (Get-ShellText 'pm list packages -3')) | ForEach-Object { $_.Package })
        $new = @($after | Where-Object { $before -notcontains $_ })
        $before = $after
        $pkg = ($new -join ',')
        Add-JournalEntry -Action 'install-app' -Description "Установлено приложение владельца из apps\: $($apk.Name)$(if ($pkg) { " ($pkg)" })" -Command $cmdText -RestoreCommand '' -Previous '' -New $pkg -Verify $(if ($pkg) { "pm path $pkg" } else { '' }) | Out-Null
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
