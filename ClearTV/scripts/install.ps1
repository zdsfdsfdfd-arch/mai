<#
.SYNOPSIS
  ClearTV — установка APK на телевизор, загрузка обоев, запуск и (по запросу) назначение главным экраном.
.DESCRIPTION
  Каждое изменение на устройстве записывается в reports\operations-journal.json вместе с командой отката,
  которую выполняет restore.ps1. Перед первым изменением создаётся снимок состояния (если его ещё нет).
.PARAMETER Ip
  Адрес телевизора для adb connect.
.PARAMETER Apk
  Путь к APK (по умолчанию — самый новый ClearTV-*.apk в dist\).
.PARAMETER Wallpapers
  Файл, папка или маска (например C:\img\*.jpg): изображения копируются в папку обоев ClearTV на ТВ.
.PARAMETER SetHome
  Назначить ClearTV главным экраном через `cmd package set-home-activity` (после подтверждения).
  Выполняйте только после успешной проверки verify.ps1.
.PARAMETER NoLaunch
  Не запускать ClearTV после установки.
.PARAMETER Yes
  Не задавать подтверждающих вопросов.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [string]$Apk,
    [string]$Wallpapers,
    [switch]$SetHome,
    [switch]$NoLaunch,
    [switch]$Yes,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
$model = Get-Prop 'ro.product.model'; $api = Get-Prop 'ro.build.version.sdk'
Write-Ok "Устройство: $serial ($model, API $api)"

if (-not (Test-Path $BackupDir) -or @(Get-ChildItem $BackupDir -Directory -ErrorAction SilentlyContinue).Count -eq 0) {
    Write-Step "Снимок состояния до изменений (не найден — создаётся)"
    $stamp = Get-Timestamp
    $backup = New-Dir (Join-Path $BackupDir $stamp)
    Write-Utf8File (Join-Path $backup 'packages-all.txt') (Get-ShellText 'pm list packages -f')
    Write-Utf8File (Join-Path $backup 'packages-third-party.txt') (Get-ShellText 'pm list packages -3')
    Write-Utf8File (Join-Path $backup 'packages-disabled.txt') (Get-ShellText 'pm list packages -d')
    Write-Utf8File (Join-Path $backup 'home-activity.txt') "$(Get-ResolvedHome)"
    Write-Utf8File (Join-Path $backup 'firmware.txt') ("fingerprint=$(Get-Prop 'ro.build.fingerprint')`ndisplay=$(Get-Prop 'ro.build.display.id')")
    Write-Ok "Снимок: $backup (полная диагностика — diagnose.ps1)"
}

if (-not $Apk) {
    $candidate = Get-ChildItem $DistDir -Filter 'ClearTV-*.apk' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $candidate) { throw "APK не найден в $DistDir. Соберите: scripts\build.ps1 (или укажите -Apk)." }
    $Apk = $candidate.FullName
}
if (-not (Test-Path $Apk)) { throw "Файл не найден: $Apk" }

Write-Step "Установка $(Split-Path -Leaf $Apk)"
$wasInstalled = ((Get-ShellText "pm path $PackageName") -match 'package:')
$prevVersion = ''
if ($wasInstalled -and ((Get-ShellText "dumpsys package $PackageName") -match 'versionName=(\S+)')) { $prevVersion = $Matches[1] }
$r = Invoke-Adb install -r -t $Apk
Write-Info $r.Output
if ($r.Output -notmatch 'Success') {
    if ($r.Output -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') { throw "Подпись отличается от установленной версии. Удалите прежнюю: adb uninstall $PackageName (настройки ClearTV будут сброшены) и повторите." }
    throw "Установка не удалась: $($r.Output)"
}
$path = Get-ShellText "pm path $PackageName"
if ($path -notmatch 'package:') { throw "После установки пакет не найден" }
$ver = ''; if ((Get-ShellText "dumpsys package $PackageName") -match 'versionName=(\S+)') { $ver = $Matches[1] }
Write-Ok "Установлено: $PackageName $ver ($($path.Trim()))"
if ($wasInstalled) {
    Add-JournalEntry -Action 'update-apk' -Description "Обновление ClearTV $prevVersion -> $ver" -Command "adb install -r -t $Apk" -RestoreCommand "" -Previous $prevVersion -New $ver -Verify "pm path $PackageName" | Out-Null
} else {
    Add-JournalEntry -Action 'install-apk' -Description "Установка ClearTV $ver" -Command "adb install -r -t $Apk" -RestoreCommand "pm uninstall $PackageName" -Previous 'not installed' -New $ver -Verify "pm path $PackageName" | Out-Null
}

if ($Wallpapers) {
    Write-Step "Обои"
    $files = @(Get-ChildItem $Wallpapers -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' })
    if ($files.Count -eq 0) { Write-Warn "Изображения не найдены: $Wallpapers" }
    else {
        $dir = "/sdcard/Android/data/$PackageName/files/wallpapers"
        Invoke-Adb shell mkdir -p $dir | Out-Null
        foreach ($f in $files) {
            $p = Invoke-Adb push $f.FullName "$dir/$($f.Name)"
            if ($p.ExitCode -eq 0) { Write-Ok "$($f.Name)" } else { Write-Warn "$($f.Name): $($p.Output)" }
        }
        Add-JournalEntry -Action 'push-wallpapers' -Description "Загружено обоев: $($files.Count)" -Command "adb push ... $dir" -RestoreCommand "rm -rf $dir" -Previous '' -New ($files.Name -join ',') | Out-Null
        Write-Info "Папка на ТВ: $dir (выбор — Настройки ClearTV → Обои)"
    }
}

if (-not $NoLaunch) {
    Write-Step "Запуск"
    $r = Invoke-Adb shell am start -W -n $HomeComponent
    Write-Info ($r.Output -replace "`n", ' | ')
    Pause-Ms 2000
    $resumed = Get-ResumedActivity
    if ($resumed -and $resumed -match [regex]::Escape($PackageName)) { Write-Ok "ClearTV на экране ($resumed)" } else { Write-Warn "На экране: $resumed — проверьте телевизор" }
}

if ($SetHome) {
    Write-Step "Назначение главным экраном"
    $current = Get-ResolvedHome
    $supported = Test-SetHomeActivitySupported
    Write-Info "Текущий HOME: $current"
    Write-Info "cmd package set-home-activity поддерживается: $supported"
    if (-not $supported) {
        Write-Warn "Прошивка не поддерживает set-home-activity. Безопасных альтернатив через ADB нет; ClearTV остаётся доступным из списка приложений штатного лаунчера (иконка ClearTV)."
    } elseif ($current -eq $HomeComponent) {
        Write-Ok "ClearTV уже назначен главным экраном"
    } else {
        Write-Host ""
        Write-Host "  Последствия: кнопка HOME и включение телевизора будут открывать ClearTV вместо '$current'." -ForegroundColor Yellow
        Write-Host "  Откат: scripts\restore.ps1 (выполнит cmd package set-home-activity $current)." -ForegroundColor Yellow
        $go = $Yes
        if (-not $go) { $answer = Read-Host "  Продолжить? [y/N]"; $go = ($answer -match '^[yYдД]') }
        if ($go) {
            $r = Invoke-Adb shell cmd package set-home-activity $HomeComponent
            Write-Info $r.Output
            Pause-Ms 1000
            $after = Get-ResolvedHome
            if ($after -eq $HomeComponent) {
                Add-JournalEntry -Action 'set-home' -Description "HOME: $current -> $HomeComponent" -Command "cmd package set-home-activity $HomeComponent" -RestoreCommand "cmd package set-home-activity $current" -Previous $current -New $HomeComponent -Verify 'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME' | Out-Null
                Write-Ok "Главный экран: $after"
                Write-Info "Проверьте кнопку HOME на пульте. Откат: scripts\restore.ps1"
            } else {
                Write-Fail "HOME не изменился (сейчас: $after). Прошивка игнорирует set-home-activity; обходные пути с системными пакетами не применяются намеренно."
                Add-JournalEntry -Action 'set-home-attempt' -Description "Попытка назначить HOME не удалась (осталось $after)" -Command "cmd package set-home-activity $HomeComponent" -RestoreCommand "" -Previous $current -New $after | Out-Null
            }
        } else { Write-Info "Отменено" }
    }
}

Write-Step "Готово"
Write-Info "Журнал операций: reports\operations-journal.json"
