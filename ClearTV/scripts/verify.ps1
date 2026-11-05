<#
.SYNOPSIS
  ClearTV — проверка основных функций на реальном телевизоре. Каждый тест действительно выполняется через ADB;
  результат PASS/FAIL/SKIP записывается с доказательствами в reports\verify-report.md и verify-report.json.
.DESCRIPTION
  Базовый набор: установлен ли пакет, холодный/тёплый запуск, навигация пультом (D-pad), открытие приложения,
  панель настроек, экран «Все приложения», перестановка плиток, системные настройки, кнопка HOME, HDMI-входы,
  потребление RAM, плавность кадров (gfxinfo), восстановление после аварийного завершения.
  По запросу: перезагрузка (-Reboot), переподключение Wi-Fi (-WifiCycle), длительная работа (-SoakMinutes N).
.PARAMETER Ip
  Адрес телевизора для adb connect.
.PARAMETER Reboot
  Выполнить перезагрузку телевизора и проверить, что главный экран поднимается.
.PARAMETER WifiCycle
  Выключить и включить Wi-Fi (svc wifi). Пропускается, если ADB сам работает через Wi-Fi.
.PARAMETER SoakMinutes
  Длительная проверка: случайные нажатия пульта N минут с замером RAM каждую минуту.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [switch]$Reboot,
    [switch]$WifiCycle,
    [int]$SoakMinutes = 0,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

$results = @()
function Add-Result([string]$Name, [string]$Status, [string]$Details, $Evidence) {
    $script:results += [pscustomobject]@{ Test = $Name; Status = $Status; Details = $Details; Evidence = $Evidence; Time = (Get-Date).ToString('HH:mm:ss') }
    switch ($Status) { 'PASS' { Write-Ok "$Name — $Details" } 'FAIL' { Write-Fail "$Name — $Details" } default { Write-Warn "$Name — ${Status}: $Details" } }
}
function Start-ClearTv {
    Invoke-Adb shell am start -n $HomeComponent | Out-Null; Pause-Ms 1500
    if (-not (Test-OnClearTv)) { Invoke-Adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.HOME -n $HomeComponent | Out-Null; Pause-Ms 1500 }
}
# HOME intent to ClearTV itself: closes overlays, scrolls the row to the start and focuses the first card (deterministic start for key tests)
function Start-Home { Invoke-Adb shell am start -a android.intent.action.MAIN -c android.intent.category.HOME -n $HomeComponent | Out-Null; Pause-Ms 1200 }
function Test-OnClearTv { $r = Get-ResumedActivity; return ($r -and ($r -match [regex]::Escape($PackageName))) }
function Wait-Event([string]$Marker, [string]$Name, [int]$TimeoutSec = 8, [scriptblock]$Where) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    do {
        $events = @(Get-EventsSince $Marker | Where-Object { $_.Name -eq $Name })
        if ($Where) { $events = @($events | Where-Object $Where) }
        if ($events.Count -gt 0) { return $events[-1] }
        Pause-Ms 500
    } while ((Get-Date) -lt $deadline)
    return $null
}

Write-Step "Подключение"
Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
$serial = Select-Device
$model = Get-Prop 'ro.product.model'; $api = [int](Get-Prop 'ro.build.version.sdk')
Write-Ok "Устройство: $serial ($model, API $api)"
$stamp = Get-Timestamp
$raw = New-Dir (Join-Path $RawDir "verify-$stamp")
$isDefaultHome = (Test-SameComponent (Get-ResolvedHome) $HomeComponent)
Write-Info "ClearTV — главный экран по умолчанию: $isDefaultHome"

# 1. installed
Write-Step "1. Установка"
$path = Get-ShellText "pm path $PackageName"
$dump = Get-ShellText "dumpsys package $PackageName"
$ver = ''; if ($dump -match 'versionName=(\S+)') { $ver = $Matches[1] }
if ($path -match 'package:') { Add-Result 'installed' 'PASS' "версия $ver" $path.Trim() } else { Add-Result 'installed' 'FAIL' 'пакет не установлен' $path; throw "ClearTV не установлен — scripts\install.ps1" }

# 2. cold start
Write-Step "2. Холодный запуск"
Invoke-Adb shell am force-stop $PackageName | Out-Null; Pause-Ms 1000
$marker = Send-Marker
$start = Invoke-Adb shell am start -W -n $HomeComponent
$total = ''; if ($start.Output -match 'TotalTime:\s*(\d+)') { $total = [int]$Matches[1] }
Pause-Ms 2000
$ff = Wait-Event $marker 'first_frame' 10
$on = Test-OnClearTv
$ffMs = if ($ff) { $ff.Fields['ms'] } else { '?' }
if ($on) { Add-Result 'cold_start' 'PASS' "am start TotalTime=$total мс, первый кадр строк=$ffMs мс" ($start.Output -replace "`n", ' | ') } else { Add-Result 'cold_start' 'FAIL' "ClearTV не на экране после запуска (TotalTime=$total)" ($start.Output -replace "`n", ' | ') }

# 3. warm start
Write-Step "3. Повторный запуск"
Invoke-Adb shell am start -a android.settings.SETTINGS | Out-Null; Pause-Ms 2000
$warm = Invoke-Adb shell am start -W -n $HomeComponent
$wtotal = ''; if ($warm.Output -match 'TotalTime:\s*(\d+)') { $wtotal = [int]$Matches[1] } elseif ($warm.Output -match 'WaitTime:\s*(\d+)') { $wtotal = "$($Matches[1]) (WaitTime, задача уже была на экране)" }
Pause-Ms 1000
if (Test-OnClearTv) { Add-Result 'warm_start' 'PASS' "TotalTime=$wtotal мс" ($warm.Output -replace "`n", ' | ') } else { Add-Result 'warm_start' 'FAIL' 'не вернулся на экран' ($warm.Output -replace "`n", ' | ') }

# 4. D-pad
Write-Step "4. Навигация пультом"
Invoke-Adb shell am start -a android.intent.action.MAIN -c android.intent.category.HOME -n $HomeComponent | Out-Null; Pause-Ms 1000
Send-Key 'KEYCODE_BACK' 300; Send-Key 'KEYCODE_BACK' 300   # close anything left open; BACK on the home itself does nothing
$favEvent = @(Get-EventsSince '' | Where-Object { $_.Name -eq 'favorites' })
$favCount = if ($favEvent.Count -gt 0) { [int]$favEvent[-1].Fields['n'] } else { 0 }
$marker = Send-Marker
foreach ($k in @('KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_LEFT', 'KEYCODE_DPAD_UP', 'KEYCODE_DPAD_DOWN')) { Send-Key $k }
$focusEvents = @(Get-EventsSince $marker | Where-Object { $_.Name -eq 'focus' })
$indices = @($focusEvents | ForEach-Object { "$($_.Fields['row']):$($_.Fields['index'])" } | Select-Object -Unique)
if ($focusEvents.Count -ge 2 -and $indices.Count -ge 2) { Add-Result 'dpad_navigation' 'PASS' "событий фокуса: $($focusEvents.Count), позиций: $($indices -join ' ')" ($focusEvents.Line -join ' | ') }
elseif ($favCount -eq 0) { Add-Result 'dpad_navigation' 'FAIL' "на главном экране нет плиток, двигать фокус некуда ($($favEvent[-1].Line))" ($focusEvents.Line -join ' | ') }
else { Add-Result 'dpad_navigation' 'FAIL' "фокус не перемещается (событий: $($focusEvents.Count), плиток: $favCount)" ($focusEvents.Line -join ' | ') }

# 5. open app
Write-Step "5. Открытие приложения с главного экрана"
if ($favCount -eq 0) { Add-Result 'open_app' 'SKIP' 'на главном экране нет приложений' '' }
else {
    $marker = Send-Marker
    Send-Key 'KEYCODE_BACK' 300; Send-Key 'KEYCODE_BACK' 300   # close any overlay; BACK on the home itself does nothing
    foreach ($i in 1..12) { Send-Key 'KEYCODE_DPAD_LEFT' 200 }
    Send-Key 'KEYCODE_DPAD_CENTER' 2500
    $launch = Wait-Event $marker 'launch' 6
    $resumed = Get-ResumedActivity
    if ($launch -and $launch.Fields['ok'] -eq 'true' -and $resumed -and $resumed -notmatch [regex]::Escape($PackageName)) { Add-Result 'open_app' 'PASS' "запущено $($launch.Fields['pkg']); на экране $resumed" $launch.Line }
    elseif ($launch) { Add-Result 'open_app' 'FAIL' "событие запуска есть ($($launch.Line)), но на экране $resumed" $launch.Line }
    else { Add-Result 'open_app' 'FAIL' "нет события запуска; на экране $resumed" '' }
    Start-ClearTv
}

# 6. settings panel
Write-Step "6. Панель настроек: пультом (▲ к кнопке «Настройки», ▶▶▶, OK), затем возврат по BACK"
Send-Key 'KEYCODE_BACK' 300; Send-Key 'KEYCODE_BACK' 300
$marker = Send-Marker
$settingsOpen = { $_.Fields['name'] -eq 'settings' -and $_.Fields['open'] -eq 'true' }
# a) the way a person does it: up from the dock to the top-right buttons, right to the last one (Settings), OK.
#    Sber remotes have no MENU key, so this path is the one that matters (first real run: MENU did nothing).
Send-Key 'KEYCODE_DPAD_UP' 400
foreach ($i in 1..3) { Send-Key 'KEYCODE_DPAD_RIGHT' 250 }
Send-Key 'KEYCODE_DPAD_CENTER' 900
$open = Wait-Event $marker 'overlay' 3 $settingsOpen
$via = 'пульт (▲, ▶▶▶, OK)'
if (-not $open) {
    Start-ClearTv                                   # in case OK landed on something else
    Send-Key 'KEYCODE_MENU' 800                     # b) remotes that do have MENU
    $open = Wait-Event $marker 'overlay' 3 $settingsOpen
    $via = 'кнопка MENU'
}
if (-not $open) {                                   # c) the hook the scripts use (am start --ez cleartv.open_settings true)
    Invoke-Adb shell am start -n $HomeComponent --ez cleartv.open_settings true | Out-Null; Pause-Ms 1200
    $open = Wait-Event $marker 'overlay' 3 $settingsOpen
    $via = 'команда am start --ez cleartv.open_settings true'
}
$closed = $null
if ($open) {
    Send-Key 'KEYCODE_BACK' 800
    $closed = Wait-Event $marker 'overlay' 4 { $_.Fields['name'] -eq 'settings' -and $_.Fields['open'] -eq 'false' }
}
if ($open -and $closed -and $via -like 'пульт*') { Add-Result 'settings_panel' 'PASS' "открылась: $via; закрылась по BACK" "$($open.Line) | $($closed.Line)" }
elseif ($open -and $closed) { Add-Result 'settings_panel' 'WARN' "путь пультом (▲, ▶▶▶, OK) не сработал; открылась через: $via; закрылась по BACK" "$($open.Line) | $($closed.Line)" }
elseif ($open) { Add-Result 'settings_panel' 'FAIL' "открылась ($via), но не закрылась по BACK" $open.Line }
else { Add-Result 'settings_panel' 'FAIL' 'не открылась ни пультом, ни по MENU, ни командой am start' '' }

# 7. all apps
Write-Step "7. Экран «Все приложения» (кнопка ▼ с дока)"
Start-Home                                       # focus back in the dock (after test 6 it sits on the Settings button)
$marker = Send-Marker
Send-Key 'KEYCODE_DPAD_DOWN' 1200
$open = Wait-Event $marker 'overlay' 4 { $_.Fields['name'] -eq 'allapps' -and $_.Fields['open'] -eq 'true' }
Send-Key 'KEYCODE_BACK' 800
$closed = Wait-Event $marker 'overlay' 4 { $_.Fields['name'] -eq 'allapps' -and $_.Fields['open'] -eq 'false' }
if ($open -and $closed) { Add-Result 'all_apps' 'PASS' "показано приложений: $($open.Fields['count'])" "$($open.Line) | $($closed.Line)" } else { Add-Result 'all_apps' 'FAIL' "open=$([bool]$open) closed=$([bool]$closed)" '' }

# 8. reorder
Write-Step "8. Перестановка плиток (длинное нажатие OK → Переместить → ▶ → OK)"
if ($favCount -lt 2) { Add-Result 'reorder' 'SKIP' 'меньше двух приложений на главном экране' '' }
else {
    Start-Home
    $marker = Send-Marker
    foreach ($i in 1..3) { Send-Key 'KEYCODE_DPAD_LEFT' 150 }
    Send-Key 'KEYCODE_DPAD_CENTER' -LongPress 1200
    Send-Key 'KEYCODE_DPAD_DOWN' 500       # Открыть → Переместить
    Send-Key 'KEYCODE_DPAD_CENTER' 800
    $moveStart = Wait-Event $marker 'move_start' 4
    Send-Key 'KEYCODE_DPAD_RIGHT' 600
    Send-Key 'KEYCODE_DPAD_CENTER' 800
    $saved = Wait-Event $marker 'order_saved' 4
    if ($moveStart -and $saved) {
        Add-Result 'reorder' 'PASS' "порядок сохранён: $($saved.Fields['order'])" "$($moveStart.Line) | $($saved.Line)"
        # move it back so the user's layout is unchanged
        Send-Key 'KEYCODE_DPAD_CENTER' -LongPress 1200; Send-Key 'KEYCODE_DPAD_DOWN' 500; Send-Key 'KEYCODE_DPAD_CENTER' 800; Send-Key 'KEYCODE_DPAD_LEFT' 600; Send-Key 'KEYCODE_DPAD_CENTER' 800
    } elseif ($moveStart) { Send-Key 'KEYCODE_BACK'; Add-Result 'reorder' 'FAIL' 'режим перемещения включился, но порядок не сохранён' $moveStart.Line }
    else { Send-Key 'KEYCODE_BACK'; Add-Result 'reorder' 'FAIL' 'длинное нажатие не открыло меню (или пункт меню не найден)' '' }
    # The test edited the row; hand it back to automatic ordering (preferred apps first) so the owner's layout is not frozen.
    Invoke-Adb shell am start -n $HomeComponent --ez cleartv.auto_layout true | Out-Null; Pause-Ms 800
}

# 9. system settings
Write-Step "9. Системные настройки"
Invoke-Adb shell am start -a android.settings.SETTINGS | Out-Null; Pause-Ms 2000
$resumed = Get-ResumedActivity
if ($resumed -and $resumed -match '(?i)settings') { Add-Result 'system_settings' 'PASS' "открыто $resumed" $resumed } else { Add-Result 'system_settings' 'FAIL' "на экране $resumed" $resumed }
Start-ClearTv

# 10. HOME key
Write-Step "10. Кнопка HOME"
Invoke-Adb shell am start -a android.settings.SETTINGS | Out-Null; Pause-Ms 2000
$marker = Send-Marker
Send-Key 'KEYCODE_HOME' 2000
$resumed = Get-ResumedActivity
$homeNow = Get-ResolvedHome
if ($resumed -match [regex]::Escape($PackageName)) { Add-Result 'home_key' 'PASS' "HOME открывает ClearTV (HOME=$homeNow)" $resumed }
elseif ($resumed -match 'ResolverActivity') { Add-Result 'home_key' 'FAIL' "кнопка HOME показывает выбор лаунчера (прошивка сбросила HOME после обновления APK; install.ps1 назначает ClearTV снова) — сейчас HOME=$homeNow" $resumed }
elseif ($isDefaultHome) { Add-Result 'home_key' 'FAIL' "ClearTV назначен HOME, но на экране $resumed" $resumed }
else { Add-Result 'home_key' 'SKIP' "ClearTV не назначен главным экраном (HOME=$homeNow); на экране $resumed. Назначить: install.ps1 -SetHome" $resumed }
Start-ClearTv

# 11. HDMI inputs
Write-Step "11. HDMI-входы"
$inputs = @(ConvertFrom-TvInputDump (Get-ShellText 'dumpsys tv_input') | Where-Object { $_.Passthrough } | Sort-Object @{ Expression = { if ($_.Type -eq 'HDMI') { 0 } else { 1 } } }, Id)
if ($inputs.Count -eq 0) { Add-Result 'hdmi_inputs' 'SKIP' 'прошивка не сообщает о физических входах через TvInputManager' '' }
else {
    $id = $inputs[0].Id
    Write-Info "Входы: $(($inputs | ForEach-Object { "$($_.Type) $($_.Id)" }) -join '; ')"
    $enc = [uri]::EscapeDataString($id)
    $r = Invoke-Adb shell am start -a android.intent.action.VIEW -d "content://android.media.tv/passthrough/$enc"
    Pause-Ms 3000
    $resumed = Get-ResumedActivity
    if ($r.Output -match 'Error|does not exist|No Activity') { Add-Result 'hdmi_inputs' 'FAIL' "вход $id найден, но обработчик переключения отсутствует: $($r.Output -replace "`n", ' ')" $r.Output }
    elseif ($resumed -and $resumed -notmatch [regex]::Escape($PackageName)) { Add-Result 'hdmi_inputs' 'PASS' "вход $($inputs[0].Type) $id открыт приложением $resumed (физических входов: $($inputs.Count), HDMI: $(@($inputs | Where-Object Type -eq 'HDMI').Count))" $resumed }
    else { Add-Result 'hdmi_inputs' 'FAIL' "после запроса входа на экране $resumed" $r.Output }
    Start-ClearTv
}

# 12. RAM
Write-Step "12. Память"
$mem = Get-ShellText "dumpsys meminfo $PackageName"
Write-Utf8File (Join-Path $raw 'meminfo.txt') $mem
$pss = ConvertFrom-MemInfoPss $mem
if ($null -ne $pss) { $mb = [math]::Round($pss / 1024, 1); Add-Result 'ram_usage' $(if ($mb -le 120) { 'PASS' } else { 'WARN' }) "PSS $mb МБ" "TOTAL PSS $pss KB" } else { Add-Result 'ram_usage' 'FAIL' 'не удалось прочитать dumpsys meminfo' $mem.Substring(0, [math]::Min(300, $mem.Length)) }

# 13. frame stats
Write-Step "13. Плавность (gfxinfo)"
Invoke-Adb shell dumpsys gfxinfo $PackageName reset | Out-Null
foreach ($k in @('KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_LEFT', 'KEYCODE_DPAD_LEFT', 'KEYCODE_DPAD_LEFT', 'KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_LEFT')) { Send-Key $k 350 }
$gfx = Get-ShellText "dumpsys gfxinfo $PackageName"
Write-Utf8File (Join-Path $raw 'gfxinfo.txt') $gfx
$g = ConvertFrom-GfxInfo $gfx
if ($null -ne $g.TotalFrames -and $g.TotalFrames -lt 20) { Add-Result 'frame_stats' 'SKIP' "слишком мало кадров для оценки ($($g.TotalFrames)): анимации выключены (настройка «Меньше анимации», включается безопасным режимом) или ряд короткий" ($g | ConvertTo-Json -Compress) }
elseif ($null -ne $g.TotalFrames) { Add-Result 'frame_stats' $(if ($g.JankyPercent -le 20) { 'PASS' } else { 'WARN' }) "кадров $($g.TotalFrames), рывков $($g.JankyFrames) ($($g.JankyPercent)%), p90 $($g.P90) мс, p95 $($g.P95) мс" ($g | ConvertTo-Json -Compress) } else { Add-Result 'frame_stats' 'SKIP' 'gfxinfo не вернул статистику (устройство может не поддерживать)' '' }

# 14. crash recovery
Write-Step "14. Восстановление после аварийного завершения"
$marker = Send-Marker
if ($api -ge 26) { Invoke-Adb shell am crash $PackageName | Out-Null } else { Invoke-Adb shell am force-stop $PackageName | Out-Null }
Pause-Ms 3000
if ($isDefaultHome) { Send-Key 'KEYCODE_HOME' 2500 } else { Start-ClearTv }
Pause-Ms 1000
$safe = Wait-Event $marker 'safe_mode' 2
if ((Test-OnClearTv) -and -not $safe) { Add-Result 'crash_recovery' 'PASS' 'главный экран поднялся заново, безопасный режим не включился' (Get-ResumedActivity) }
elseif (Test-OnClearTv) { Add-Result 'crash_recovery' 'WARN' 'поднялся, но сработал безопасный режим (см. files/crash на устройстве)' $safe.Line }
else { Add-Result 'crash_recovery' 'FAIL' "после сбоя на экране $(Get-ResumedActivity)" '' }

# 15. reboot (opt-in)
if ($Reboot) {
    Write-Step "15. Перезагрузка"
    Invoke-Adb reboot | Out-Null
    Pause-Ms 15000
    if (Wait-ForDevice 240) {
        Pause-Ms 12000
        $resumed = Get-ResumedActivity
        if ($resumed -match [regex]::Escape($PackageName)) { Add-Result 'reboot' 'PASS' "после загрузки на экране ClearTV" $resumed }
        elseif ($isDefaultHome) { Add-Result 'reboot' 'FAIL' "ClearTV назначен HOME, но после загрузки на экране $resumed" $resumed }
        else { Add-Result 'reboot' 'SKIP' "загрузка прошла; ClearTV не HOME, на экране $resumed" $resumed }
    } else { Add-Result 'reboot' 'FAIL' 'устройство не вернулось в сеть за 4 минуты' '' }
}

# 16. wifi cycle (opt-in)
if ($WifiCycle) {
    Write-Step "16. Переподключение Wi-Fi"
    $overWifi = ($serial -match ':\d+$')
    if ($overWifi) { Add-Result 'wifi_cycle' 'SKIP' 'ADB работает по Wi-Fi: выключение Wi-Fi разорвёт соединение. Подключите USB/Ethernet.' '' }
    else {
        Start-ClearTv
        $marker = Send-Marker
        Invoke-Adb shell svc wifi disable | Out-Null
        $lost = Wait-Event $marker 'network' 15 { $_.Fields['transport'] -eq 'NONE' -or $_.Fields['transport'] -eq 'OTHER' }
        Invoke-Adb shell svc wifi enable | Out-Null
        $back = Wait-Event $marker 'network' 90 { $_.Fields['transport'] -eq 'WIFI' -and $_.Fields['validated'] -eq 'true' }
        if ($lost -and $back) { Add-Result 'wifi_cycle' 'PASS' 'индикатор отразил потерю и восстановление сети' "$($lost.Line) | $($back.Line)" } else { Add-Result 'wifi_cycle' 'FAIL' "lost=$([bool]$lost) back=$([bool]$back)" '' }
    }
}

# 17. soak (opt-in)
if ($SoakMinutes -gt 0) {
    Write-Step "17. Длительная работа: $SoakMinutes мин"
    Start-ClearTv
    $samples = @()
    $keys = @('KEYCODE_DPAD_RIGHT', 'KEYCODE_DPAD_LEFT', 'KEYCODE_DPAD_UP', 'KEYCODE_DPAD_DOWN', 'KEYCODE_MENU', 'KEYCODE_BACK', 'KEYCODE_BACK')
    $end = (Get-Date).AddMinutes($SoakMinutes); $nextSample = Get-Date; $rnd = New-Object System.Random
    while ((Get-Date) -lt $end) {
        Send-Key $keys[$rnd.Next($keys.Count)] 700
        if ((Get-Date) -ge $nextSample) {
            $p = ConvertFrom-MemInfoPss (Get-ShellText "dumpsys meminfo $PackageName")
            if ($null -ne $p) { $samples += [math]::Round($p / 1024, 1); Write-Info "PSS $($samples[-1]) МБ" }
            $nextSample = (Get-Date).AddSeconds(60)
        }
        if (-not (Test-OnClearTv)) { Start-ClearTv }
    }
    if ($samples.Count -ge 2) {
        $growth = $samples[-1] - $samples[0]
        Add-Result 'soak' $(if ($growth -le 30) { 'PASS' } else { 'WARN' }) "PSS $($samples[0]) → $($samples[-1]) МБ (рост $growth МБ за $SoakMinutes мин)" ($samples -join ', ')
    } else { Add-Result 'soak' 'SKIP' 'недостаточно замеров' '' }
}

# ------------------------------------------------------------------ report
Start-ClearTv
Write-Step "Отчёт"
$logcat = (Invoke-Adb logcat -d -s 'ClearTV:*').Output
Write-Utf8File (Join-Path $raw 'logcat-cleartv.txt') $logcat
$summary = [ordered]@{ Time = (Get-Date).ToString('o'); Serial = $serial; Model = $model; Api = $api; Version = $ver; DefaultHome = $isDefaultHome; Results = $results; Raw = $raw }
Write-JsonFile (Join-Path $ReportsDir 'verify-report.json') $summary
$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Проверка ClearTV на устройстве — $model (API $api)")
[void]$md.AppendLine("")
[void]$md.AppendLine("Дата: $(Get-Date -Format 'yyyy-MM-dd HH:mm'); ClearTV $ver; главный экран по умолчанию: $isDefaultHome; сырые логи: ``reports/raw/verify-$stamp``.")
[void]$md.AppendLine("")
[void]$md.AppendLine("Итог: PASS $(@($results | Where-Object Status -eq 'PASS').Count), FAIL $(@($results | Where-Object Status -eq 'FAIL').Count), WARN $(@($results | Where-Object Status -eq 'WARN').Count), SKIP $(@($results | Where-Object Status -eq 'SKIP').Count).")
[void]$md.AppendLine("")
[void]$md.Append((ConvertTo-MarkdownTable $results @('Test', 'Status', 'Details', 'Evidence')))
Write-Utf8File (Join-Path $ReportsDir 'verify-report.md') $md.ToString()
Write-Ok "reports\verify-report.md"
$fails = @($results | Where-Object { $_.Status -eq 'FAIL' }).Count
if ($fails -gt 0) { Write-Fail "Провалено тестов: $fails" } else { Write-Ok "Провалов нет" }
