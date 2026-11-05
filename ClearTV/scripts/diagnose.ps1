<#
.SYNOPSIS
  ClearTV — диагностика окружения Windows и телевизора (Салют ТВ / Android TV) через ADB.
.DESCRIPTION
  1. Проверяет инструменты на ПК: adb, JDK, Android SDK, Gradle wrapper, ffmpeg (необязательно).
  2. При наличии устройства собирает reports/device-report.json и device-report.md: модель, Android/API,
     прошивка, CPU, память, экран, пакеты, текущий HOME, сервисы, HDMI-CEC и TV-входы, устройства ввода.
  3. Делает снимок состояния "до изменений" в reports/backup/<время>/ (пакеты, HOME, прошивка, настройки).
  4. Строит инвентаризацию пакетов с категориями CRITICAL / OPTIONAL / PROMOTIONAL-CANDIDATE / UNKNOWN
     (reports/inventory.json, inventory.md).
.PARAMETER Ip
  Адрес телевизора для `adb connect` (например 192.168.1.50). Отладка по сети должна быть включена на ТВ.
.PARAMETER Serial
  Серийный номер/адрес уже подключённого устройства (если их несколько).
.PARAMETER SkipDevice
  Только проверка окружения ПК, без подключения к телевизору.
.PARAMETER Capture
  Зафиксировать текущий экран телевизора: активное окно/пакет + скриншот. Запускайте, когда на экране
  виден рекламный блок, — это единственный способ привязать блок к конкретному пакету.
.PARAMETER AutoInstallTools
  Без вопросов скачать Android Platform Tools (adb) с официального сайта Google, если adb не найден.
.EXAMPLE
  .\scripts\diagnose.ps1 -Ip 192.168.1.50
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [switch]$SkipDevice,
    [switch]$Capture,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

$stamp = Get-Timestamp
New-Dir $ReportsDir | Out-Null

# ------------------------------------------------------------------ 1. environment
Write-Step "Окружение ПК"
$envReport = [ordered]@{ Time = (Get-Date).ToString('o'); OS = ''; PowerShell = $PSVersionTable.PSVersion.ToString(); Adb = $null; AdbVersion = ''; Java = $null; AndroidSdk = $null; SdkPlatforms = @(); SdkBuildTools = @(); GradleWrapper = $false; Ffmpeg = $null; Problems = @() }
try { $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $envReport.OS = "$($os.Caption) $($os.Version)" } catch { $envReport.OS = [System.Environment]::OSVersion.VersionString }
Write-Info "ОС: $($envReport.OS); PowerShell $($envReport.PowerShell)"

$adb = Find-Adb
if (-not $adb -and $AutoInstallTools) { $adb = Install-PlatformTools -Yes }
if ($adb) {
    $script:Adb = $adb
    $envReport.Adb = $adb
    $envReport.AdbVersion = ((Invoke-Adb version).Output -split "`n")[0]
    Write-Ok "adb: $adb ($($envReport.AdbVersion))"
} else {
    $envReport.Problems += 'adb не найден: установите Android SDK Platform Tools (developer.android.com/tools/releases/platform-tools) или запустите diagnose.ps1 -AutoInstallTools'
    Write-Fail "adb не найден"
}

$java = Get-JavaVersion
$envReport.Java = $java
if ($java.Found -and $java.Major -ge 17) { Write-Ok "Java $($java.Major): $($java.Path)" }
elseif ($java.Found) { Write-Warn "Найдена Java $($java.Major), для сборки нужна JDK 17+ (например, winget install Microsoft.OpenJDK.17)"; $envReport.Problems += 'JDK 17+ не найдена' }
else { Write-Warn "Java не найдена: для сборки APK установите JDK 17+ (winget install Microsoft.OpenJDK.17)"; $envReport.Problems += 'JDK не найдена' }

$sdk = Find-AndroidSdk
if ($sdk) {
    $envReport.AndroidSdk = $sdk
    $plat = Join-Path $sdk 'platforms'; if (Test-Path $plat) { $envReport.SdkPlatforms = @(Get-ChildItem $plat -Directory | ForEach-Object { $_.Name }) }
    $bt = Join-Path $sdk 'build-tools'; if (Test-Path $bt) { $envReport.SdkBuildTools = @(Get-ChildItem $bt -Directory | ForEach-Object { $_.Name }) }
    Write-Ok "Android SDK: $sdk (platforms: $($envReport.SdkPlatforms -join ', '); build-tools: $($envReport.SdkBuildTools -join ', '))"
    if ($envReport.SdkPlatforms -notcontains 'android-34') { Write-Warn "Платформа android-34 не установлена — build.ps1 установит её через sdkmanager" }
} else {
    Write-Warn "Android SDK не найден — build.ps1 -InstallSdk скачает командные инструменты SDK с dl.google.com"
    $envReport.Problems += 'Android SDK не найден'
}
$envReport.GradleWrapper = (Test-Path (Join-Path $ProjectRoot 'gradlew.bat'))
if ($envReport.GradleWrapper) { Write-Ok "Gradle wrapper: gradlew.bat (Gradle загрузится автоматически при первой сборке)" } else { Write-Warn "gradlew.bat отсутствует" }
$ff = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ff) { $envReport.Ffmpeg = $ff.Source; Write-Ok "ffmpeg: $($ff.Source)" } else { Write-Info "ffmpeg не найден (нужен только для анализа видео-референса, необязательно)" }
Write-JsonFile (Join-Path $ReportsDir 'environment-report.json') $envReport

if ($SkipDevice) { Write-Step "Готово (без устройства). Отчёт: reports\environment-report.json"; return }

# ------------------------------------------------------------------ 2. device
Write-Step "Подключение к телевизору"
if (-not $script:Adb) { throw "adb недоступен — диагностика устройства невозможна." }
if ($Ip) { if (-not (Connect-Tv $Ip)) { throw "Не удалось подключиться к $Ip. На телевизоре: Настройки → Система/Об устройстве → 7 раз нажать на номер сборки → Для разработчиков → Отладка по сети (ADB). Затем подтвердите запрос на экране." } }
if ($Serial) { $script:Serial = $Serial }
$serial = Select-Device
Write-Ok "Устройство: $serial"

if ($Capture) {
    Write-Step "Фиксация текущего экрана"
    $dir = New-Dir (Join-Path $RawDir "capture-$stamp")
    $resumed = Get-ResumedActivity
    $focus = (Get-ShellText 'dumpsys window') -split "`n" | Where-Object { $_ -match 'mCurrentFocus|mFocusedApp' } | ForEach-Object { $_.Trim() }
    Invoke-Adb shell screencap -p /sdcard/cleartv-capture.png | Out-Null
    Invoke-Adb pull /sdcard/cleartv-capture.png (Join-Path $dir 'screen.png') | Out-Null
    Invoke-Adb shell rm /sdcard/cleartv-capture.png | Out-Null
    $pkg = if ($resumed) { ($resumed -split '/')[0] } else { '' }
    $entry = [pscustomobject]@{ Time = (Get-Date).ToString('o'); Package = $pkg; Activity = $resumed; WindowFocus = ($focus -join ' | '); Screenshot = (Join-Path $dir 'screen.png'); Note = 'зафиксировано пользователем как экран с рекламным блоком' }
    $capPath = Join-Path $ReportsDir 'focus-captures.json'
    $captures = @(Read-JsonFile $capPath); if ($null -eq $captures[0]) { $captures = @() }
    $captures += $entry
    Write-JsonFile $capPath $captures
    Write-Ok "Активное окно: $resumed"
    Write-Ok "Скриншот: $($entry.Screenshot)"
    Write-Info "Запись добавлена в reports\focus-captures.json; при следующей инвентаризации пакет $pkg будет отмечен как кандидат."
    return
}

$raw = New-Dir (Join-Path $RawDir $stamp)
function Save-Raw([string]$Name, [string]$Command) {
    $r = Invoke-AdbShell $Command
    Write-Utf8File (Join-Path $raw "$Name.txt") $r.Output
    return $r.Output
}

Write-Step "Сбор данных (reports\raw\$stamp)"
$propsText = Save-Raw 'getprop' 'getprop'
$props = ConvertFrom-GetProp $propsText
function P([string]$n) { if ($props.ContainsKey($n)) { $props[$n] } else { '' } }

$cpuinfo = Save-Raw 'cpuinfo' 'cat /proc/cpuinfo'
$meminfo = Save-Raw 'meminfo' 'cat /proc/meminfo'
$wmSize = Save-Raw 'wm_size' 'wm size'
$wmDensity = Save-Raw 'wm_density' 'wm density'
$display = Save-Raw 'dumpsys_display' 'dumpsys display'
$features = Save-Raw 'pm_features' 'pm list features'
$services = Save-Raw 'service_list' 'service list'
$actServices = Save-Raw 'dumpsys_activity_services' 'dumpsys activity services'
$processes = Save-Raw 'dumpsys_activity_processes' 'dumpsys activity processes'
$hdmi = Save-Raw 'dumpsys_hdmi_control' 'dumpsys hdmi_control'
$tvInput = Save-Raw 'dumpsys_tv_input' 'dumpsys tv_input'
$input = Save-Raw 'dumpsys_input' 'dumpsys input'
$windowDisplays = Save-Raw 'dumpsys_window_displays' 'dumpsys window displays'
$ignoreOrientation = Save-Raw 'wm_ignore_orientation' 'wm get-ignore-orientation-request'
$audio = Save-Raw 'dumpsys_audio' 'dumpsys audio'
$storage = Save-Raw 'df' 'df -h /data'
$uptime = Save-Raw 'uptime' 'cat /proc/uptime'
$settingsGlobal = Save-Raw 'settings_global' 'settings list global'
$settingsSecure = Save-Raw 'settings_secure' 'settings list secure'
$settingsSystem = Save-Raw 'settings_system' 'settings list system'
$cmdPkgHelp = Save-Raw 'cmd_package_help' 'cmd package help'
$roleHolders = Save-Raw 'role_home' 'cmd role get-role-holders android.app.role.HOME'
$resumedNow = Get-ResumedActivity
Invoke-Adb shell screencap -p /sdcard/cleartv-diag.png | Out-Null
Invoke-Adb pull /sdcard/cleartv-diag.png (Join-Path $raw 'screen.png') | Out-Null
Invoke-Adb shell rm /sdcard/cleartv-diag.png | Out-Null

Write-Step "Инвентаризация пакетов"
$inv = Get-DeviceInventory
foreach ($k in $inv.Raw.Keys) { Write-Utf8File (Join-Path $raw "inventory_$k.txt") ([string]$inv.Raw[$k]) }
$homeComponent = Get-ResolvedHome
$homeCandidates = Get-HomeCandidates
$setHomeSupported = ($cmdPkgHelp -match 'set-home-activity')
$homePkg = if ($homeComponent) { ($homeComponent -split '/')[0] } else { '' }
$launcherDump = ''
if ($homePkg) { $launcherDump = Save-Raw 'dumpsys_package_home' "dumpsys package $homePkg" }
$launcherMem = ''
if ($homePkg) { $launcherMem = Save-Raw 'meminfo_home' "dumpsys meminfo $homePkg" }

# ------------------------------------------------------------------ derived values
$memTotalKb = 0; $memAvailKb = 0
if ($meminfo -match 'MemTotal:\s+(\d+)') { $memTotalKb = [int]$Matches[1] }
if ($meminfo -match 'MemAvailable:\s+(\d+)') { $memAvailKb = [int]$Matches[1] }
$cores = ([regex]::Matches($cpuinfo, '(?m)^processor\s*:')).Count
$hardware = ''; if ($cpuinfo -match '(?m)^Hardware\s*:\s*(.+)$') { $hardware = $Matches[1].Trim() }
$physical = ''; if ($wmSize -match 'Physical size:\s*(\S+)') { $physical = $Matches[1] }
$override = ''; if ($wmSize -match 'Override size:\s*(\S+)') { $override = $Matches[1] }
$density = ''; if ($wmDensity -match 'Physical density:\s*(\d+)') { $density = $Matches[1] }
$refresh = ''; if ($display -match 'refreshRate[= ]+([\d.]+)') { $refresh = $Matches[1] }
$inputs = @(ConvertFrom-TvInputDump $tvInput)
$cecEnabled = Test-HdmiCecEnabled $hdmi
$inputDevices = @([regex]::Matches($input, '(?m)^\s*\d+:\s+(.+?)\s*$') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
$remoteLike = @($inputDevices | Where-Object { $_ -match '(?i)remote|rc|ir|bluetooth|bt|keypad|key' })
$serviceCount = ([regex]::Matches($services, '(?m)^\d+\s')).Count
$runningServices = ([regex]::Matches($actServices, 'ServiceRecord\{')).Count
$leanbackFeature = ($features -match 'android.software.leanback')
$liveTvFeature = ($features -match 'android.software.live_tv')
$cecFeature = ($features -match 'android.hardware.hdmi.cec')
$pkgs = @($inv.Packages)

$report = [ordered]@{
    Time = (Get-Date).ToString('o'); Serial = $serial
    Device = [ordered]@{ Manufacturer = (P 'ro.product.manufacturer'); Brand = (P 'ro.product.brand'); Model = (P 'ro.product.model'); Device = (P 'ro.product.device'); Board = (P 'ro.product.board'); Hardware = $hardware; Name = (P 'ro.product.name') }
    Android = [ordered]@{ Release = (P 'ro.build.version.release'); Api = (P 'ro.build.version.sdk'); SecurityPatch = (P 'ro.build.version.security_patch'); Fingerprint = (P 'ro.build.fingerprint'); BuildId = (P 'ro.build.display.id'); BuildDate = (P 'ro.build.date'); Incremental = (P 'ro.build.version.incremental'); Type = (P 'ro.build.type'); Tags = (P 'ro.build.tags') }
    Firmware = [ordered]@{ Display = (P 'ro.build.display.id'); VendorProps = @($props.Keys | Where-Object { $_ -match '(?i)sber|salute|firmware|ota|starline|smartstar' } | Sort-Object | ForEach-Object { "$_=$($props[$_])" }) }
    Cpu = [ordered]@{ Abi = (P 'ro.product.cpu.abi'); AbiList = (P 'ro.product.cpu.abilist'); Cores = $cores; Hardware = $hardware; Platform = (P 'ro.board.platform'); Chipname = (P 'ro.hardware') }
    Memory = [ordered]@{ TotalMb = [math]::Round($memTotalKb / 1024); AvailableMb = [math]::Round($memAvailKb / 1024); LowRam = (P 'ro.config.low_ram'); Storage = $storage.Trim() }
    Display = [ordered]@{ PhysicalSize = $physical; OverrideSize = $override; DensityDpi = $density; RefreshRate = $refresh }
    Packages = [ordered]@{ Total = $pkgs.Count; System = @($pkgs | Where-Object { $_.System }).Count; ThirdParty = @($pkgs | Where-Object { -not $_.System }).Count; Disabled = @($pkgs | Where-Object { $_.Enabled -match 'disabled' }).Count; Leanback = @($pkgs | Where-Object { $_.Launcher -eq 'leanback' }).Count; ByCategory = [ordered]@{ CRITICAL = @($pkgs | Where-Object { $_.Category -eq 'CRITICAL' }).Count; PROMOTIONAL = @($pkgs | Where-Object { $_.Category -eq 'PROMOTIONAL' }).Count; OPTIONAL = @($pkgs | Where-Object { $_.Category -eq 'OPTIONAL' }).Count; 'PROMOTIONAL-CANDIDATE' = @($pkgs | Where-Object { $_.Category -eq 'PROMOTIONAL-CANDIDATE' }).Count; UNKNOWN = @($pkgs | Where-Object { $_.Category -eq 'UNKNOWN' }).Count } }
    Home = [ordered]@{ Current = $homeComponent; Candidates = $homeCandidates; RoleHolders = $roleHolders.Trim(); SetHomeActivitySupported = $setHomeSupported; ResumedActivityNow = $resumedNow; ClearTvInstalled = ($pkgs.Package -contains $PackageName) }
    Services = [ordered]@{ Registered = $serviceCount; RunningRecords = $runningServices }
    Tv = [ordered]@{ LeanbackFeature = $leanbackFeature; LiveTvFeature = $liveTvFeature; HdmiCecFeature = $cecFeature; HdmiCecEnabled = $cecEnabled; Inputs = $inputs; PassthroughInputs = @($inputs | Where-Object { $_.Passthrough }).Count }
    InputDevices = [ordered]@{ All = $inputDevices; RemoteCandidates = $remoteLike }
    Uptime = $uptime.Trim()
    RawDir = $raw
}
Write-JsonFile (Join-Path $ReportsDir 'device-report.json') $report

# ------------------------------------------------------------------ 3. backup snapshot (state before any change)
$backup = New-Dir (Join-Path $BackupDir $stamp)
Write-Utf8File (Join-Path $backup 'packages-all.txt') $inv.Raw.PackagesF
Write-Utf8File (Join-Path $backup 'packages-third-party.txt') $inv.Raw.PackagesThird
Write-Utf8File (Join-Path $backup 'packages-disabled.txt') $inv.Raw.PackagesDis
Write-Utf8File (Join-Path $backup 'home-activity.txt') "$homeComponent"
Write-Utf8File (Join-Path $backup 'home-candidates.txt') ($homeCandidates -join "`n")
Write-Utf8File (Join-Path $backup 'firmware.txt') ("fingerprint=$(P 'ro.build.fingerprint')`ndisplay=$(P 'ro.build.display.id')`nincremental=$(P 'ro.build.version.incremental')`nrelease=$(P 'ro.build.version.release')`napi=$(P 'ro.build.version.sdk')")
Write-Utf8File (Join-Path $backup 'settings-global.txt') $settingsGlobal
Write-Utf8File (Join-Path $backup 'settings-secure.txt') $settingsSecure
Write-Utf8File (Join-Path $backup 'settings-system.txt') $settingsSystem
Write-Utf8File (Join-Path $backup 'README.txt') "Снимок состояния до изменений, $stamp.`nЭти файлы — справочные (списки и значения), не резервная копия данных приложений. restore.ps1 восстанавливает только то, что записано в reports/operations-journal.json."
Write-Ok "Снимок состояния: $backup"

# ------------------------------------------------------------------ 4. inventory files
Write-JsonFile (Join-Path $ReportsDir 'inventory.json') $pkgs
$title = "$($report.Device.Manufacturer) $($report.Device.Model) (Android $($report.Android.Release), API $($report.Android.Api))"
Write-Utf8File (Join-Path $ReportsDir 'inventory.md') (Format-InventoryMarkdown $inv $title)

# ------------------------------------------------------------------ 5. markdown report
$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Диагностика телевизора — $title")
[void]$md.AppendLine("")
[void]$md.AppendLine("Собрано $(Get-Date -Format 'yyyy-MM-dd HH:mm') через ADB ($serial). Сырые дампы: ``reports/raw/$stamp``.")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 1. Устройство и прошивка")
[void]$md.AppendLine("")
[void]$md.AppendLine("| Параметр | Значение |`n|---|---|")
[void]$md.AppendLine("| Производитель / бренд | $($report.Device.Manufacturer) / $($report.Device.Brand) |")
[void]$md.AppendLine("| Модель / device / board | $($report.Device.Model) / $($report.Device.Device) / $($report.Device.Board) |")
[void]$md.AppendLine("| Android / API | $($report.Android.Release) / $($report.Android.Api) |")
[void]$md.AppendLine("| Сборка (display id) | $($report.Android.BuildId) |")
[void]$md.AppendLine("| Fingerprint | $($report.Android.Fingerprint) |")
[void]$md.AppendLine("| Патч безопасности / дата | $($report.Android.SecurityPatch) / $($report.Android.BuildDate) |")
[void]$md.AppendLine("| Свойства прошивки (sber/salute/ota) | $(($report.Firmware.VendorProps -join '; ')) |")
[void]$md.AppendLine("| CPU | $($report.Cpu.Hardware) $($report.Cpu.Platform), ядер: $($report.Cpu.Cores), ABI: $($report.Cpu.AbiList) |")
[void]$md.AppendLine("| RAM всего / доступно | $($report.Memory.TotalMb) МБ / $($report.Memory.AvailableMb) МБ (low_ram=$($report.Memory.LowRam)) |")
[void]$md.AppendLine("| Экран | $($report.Display.PhysicalSize) (override: $($report.Display.OverrideSize)), $($report.Display.DensityDpi) dpi, $($report.Display.RefreshRate) Гц |")
[void]$md.AppendLine("| Uptime (с) | $($report.Uptime) |")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 2. Пакеты")
[void]$md.AppendLine("")
[void]$md.AppendLine("Всего $($report.Packages.Total): системных $($report.Packages.System), пользовательских $($report.Packages.ThirdParty), отключённых $($report.Packages.Disabled), с TV-иконкой (leanback) $($report.Packages.Leanback). Категории: CRITICAL $($report.Packages.ByCategory.CRITICAL), PROMOTIONAL (реклама/телеметрия по отчётам) $($report.Packages.ByCategory.PROMOTIONAL), OPTIONAL $($report.Packages.ByCategory.OPTIONAL), PROMOTIONAL-CANDIDATE $($report.Packages.ByCategory.'PROMOTIONAL-CANDIDATE'), UNKNOWN $($report.Packages.ByCategory.UNKNOWN). Полная таблица: ``reports/inventory.md``.")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 3. Главный экран (HOME)")
[void]$md.AppendLine("")
[void]$md.AppendLine("- Текущий HOME: ``$homeComponent``")
[void]$md.AppendLine("- Кандидаты HOME: $(($homeCandidates | ForEach-Object { '`' + $_ + '`' }) -join ', ')")
[void]$md.AppendLine("- Держатель роли HOME (Android 10+): ``$($report.Home.RoleHolders)``")
[void]$md.AppendLine("- ``cmd package set-home-activity`` доступна: **$setHomeSupported**")
[void]$md.AppendLine("- Активность на экране в момент диагностики: ``$resumedNow`` (скриншот: ``reports/raw/$stamp/screen.png``)")
[void]$md.AppendLine("- ClearTV установлен: $($report.Home.ClearTvInstalled)")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 4. Сервисы, HDMI-CEC, входы, ввод")
[void]$md.AppendLine("")
[void]$md.AppendLine("- Зарегистрированных системных сервисов: $serviceCount; записей запущенных сервисов приложений: $runningServices")
[void]$md.AppendLine("- Leanback: $leanbackFeature; Live TV: $liveTvFeature; HDMI-CEC feature: $cecFeature; CEC включён: $cecEnabled")
[void]$md.AppendLine("- TV-входы (TvInputManager): $($inputs.Count), из них физических (HDMI и т.п.): $($report.Tv.PassthroughInputs)")
foreach ($i in $inputs) { [void]$md.AppendLine("  - ``$($i.Id)`` тип $($i.Type)") }
[void]$md.AppendLine("- Устройства ввода: $($inputDevices.Count); похожие на пульт: $(($remoteLike -join '; '))")
[void]$md.AppendLine("")
[void]$md.AppendLine("## 5. Что дальше")
[void]$md.AppendLine("")
[void]$md.AppendLine("1. Просмотреть ``reports/inventory.md``; ничего не отключать из CRITICAL/UNKNOWN.")
[void]$md.AppendLine("2. Когда на штатном лаунчере виден рекламный блок — выполнить ``diagnose.ps1 -Capture`` для привязки блока к пакету.")
[void]$md.AppendLine("3. Установить ClearTV: ``install.ps1 -Ip <адрес>``; проверить: ``verify.ps1``; назначить HOME: ``install.ps1 -SetHome`` (только после успешной проверки).")
Write-Utf8File (Join-Path $ReportsDir 'device-report.md') $md.ToString()

Write-Step "Готово"
Write-Ok "reports\device-report.md, device-report.json"
Write-Ok "reports\inventory.md, inventory.json"
Write-Ok "reports\backup\$stamp (снимок до изменений)"
Write-Info "Текущий HOME: $homeComponent; set-home-activity: $setHomeSupported; RAM: $($report.Memory.TotalMb) МБ; входов: $($inputs.Count)"
