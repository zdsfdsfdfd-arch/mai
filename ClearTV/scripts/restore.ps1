<#
.SYNOPSIS
  ClearTV — откат изменений, сделанных проектом на телевизоре.
.DESCRIPTION
  Читает reports\operations-journal.json и выполняет команды отката ТОЛЬКО для записанных там операций
  (назначение HOME, установка APK, загрузка обоев, отключение пакетов), в обратном порядке. Скрипт не
  заявляет восстановление того, чего не делал проект: если журнала нет — восстанавливать нечего.
.PARAMETER Uninstall
  Также удалить ClearTV с телевизора (если установка записана в журнале).
.PARAMETER List
  Только показать журнал, ничего не выполнять.
.PARAMETER Yes
  Не задавать подтверждающих вопросов.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [switch]$Uninstall,
    [switch]$List,
    [switch]$Yes,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

Write-Step "Журнал операций"
$entries = @(Read-Journal)
if ($entries.Count -eq 0) {
    Write-Info "Журнал reports\operations-journal.json пуст или отсутствует: проект не вносил изменений в этот телевизор, восстанавливать нечего."
    if (Test-Path $BackupDir) { Write-Info "Справочные снимки состояния: $BackupDir" }
    return
}
foreach ($e in $entries) {
    $state = if ($e.Restored) { 'восстановлено ' + $e.RestoredAt } else { 'ожидает' }
    Write-Info ("[{0}] {1}: {2}  ->  откат: {3}  ({4})" -f $e.Time, $e.Action, $e.Description, $(if ($e.RestoreCommand) { $e.RestoreCommand } else { '—' }), $state)
}
if ($List) { return }

$pending = @($entries | Where-Object { -not $_.Restored -and $_.RestoreCommand })
if (-not $Uninstall) { $pending = @($pending | Where-Object { $_.Action -ne 'install-apk' }) }
if ($pending.Count -eq 0) {
    Write-Ok "Нет операций, требующих отката$(if (-not $Uninstall) { ' (установка ClearTV сохраняется; добавьте -Uninstall, чтобы удалить приложение)' })."
    return
}

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
Write-Ok "Устройство: $serial"

Write-Step "Откат ($($pending.Count))"
[array]::Reverse($pending)
foreach ($e in $pending) {
    Write-Host ""
    Write-Info "$($e.Action): $($e.Description)"
    Write-Info "команда: adb shell $($e.RestoreCommand)"
    $go = $Yes
    if (-not $go) { $answer = Read-Host "  Выполнить? [y/N]"; $go = ($answer -match '^[yYдД]') }
    if (-not $go) { Write-Info "пропущено"; continue }
    $cmd = [string]$e.RestoreCommand
    if ($e.Action -eq 'set-home' -and ($e.Previous -match 'ResolverActivity|FallbackHome' -or -not $e.Previous)) {
        # Older journals (ClearTV <= 0.1.4) could record the firmware's chooser as the previous HOME; use a real launcher.
        $real = ''
        foreach ($dir in @(Get-ChildItem $BackupDir -Directory -ErrorAction SilentlyContinue | Sort-Object Name)) {
            $f = Join-Path $dir.FullName 'home-activity.txt'
            if (Test-Path $f) { $h = ([string](Get-Content $f -Raw)).Trim(); if ($h -and $h -notmatch 'ResolverActivity|FallbackHome' -and -not (Test-SameComponent $h $HomeComponent)) { $real = $h; break } }
        }
        if (-not $real) { $stock = [string](Get-KnowledgeBase).Raw.platform.stock_home; if ($stock -and ((Get-ShellText "pm path $(($stock -split '/')[0])") -match 'package:')) { $real = $stock } }
        if ($real) { $cmd = Get-SetHomeRestoreCommand $real; $e.Previous = $real; Write-Info "в журнале вместо лаунчера записан выбор системы; возвращаю $real" }
    }
    $r = Invoke-AdbShell $cmd
    if ($r.Output) { Write-Info $r.Output }
    $ok = ($r.ExitCode -eq 0 -and $r.Output -notmatch 'Error|Failure|Exception')
    if ($e.Action -eq 'set-home') {
        $now = Get-ResolvedHome
        $ok = (Test-SameComponent $now $e.Previous)
        if ($ok) { Write-Ok "HOME восстановлен: $now" } else { Write-Fail "HOME сейчас: $now (ожидалось $($e.Previous))" }
    } elseif ($e.Action -eq 'install-apk') {
        $ok = ((Get-ShellText "pm path $PackageName") -notmatch 'package:')
        if ($ok) { Write-Ok "ClearTV удалён" } else { Write-Fail "ClearTV всё ещё установлен" }
    } elseif ($e.Action -eq 'uninstall-user-app') {
        $pkg = ($e.RestoreCommand -replace '^cmd package install-existing\s+', '').Trim()
        $ok = ((Get-ShellText "pm path $pkg") -match 'package:')
        if ($ok) { Write-Ok "$pkg установлено снова" } else { Write-Fail "$pkg не вернулось (install-existing)" }
    } elseif ($e.Action -eq 'disable-package') {
        $pkg = ($e.RestoreCommand -replace '^pm enable\s+', '').Trim()
        $ok = ((Get-ShellText 'pm list packages -d') -notmatch ("(?m)^package:" + [regex]::Escape($pkg) + '\s*$'))
        if ($ok) { Write-Ok "$pkg включён" } else { Write-Fail "$pkg всё ещё отключён" }
    } elseif ($ok) { Write-Ok "выполнено" } else { Write-Fail "команда вернула ошибку (exit $($r.ExitCode))" }
    if ($ok) { Set-JournalRestored $e.Id }
}
Write-Step "Готово"
Write-Info "Операции без команды отката (например, обновление версии APK) в журнале помечены '—' и изменений не требуют."
