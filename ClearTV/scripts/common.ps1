# ClearTV — shared helpers for the PowerShell scripts (Windows PowerShell 5.1 and PowerShell 7+).
# Dot-source this file: . "$PSScriptRoot\common.ps1"
#
# Every ADB call goes through Invoke-Adb, which logs the command, its exit code and output to
# reports/adb-log.txt. Every change the project makes on the TV is recorded in reports/operations-journal.json
# together with the command that undoes it; restore.ps1 replays exactly those entries and nothing else.

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$script:ProjectRoot   = Split-Path -Parent $PSScriptRoot
$script:ReportsDir    = $(if ($env:CLEARTV_REPORTS_DIR) { $env:CLEARTV_REPORTS_DIR } else { Join-Path $ProjectRoot 'reports' })
$script:RawDir        = Join-Path $ReportsDir 'raw'
$script:BackupDir     = Join-Path $ReportsDir 'backup'
$script:DistDir       = Join-Path $ProjectRoot 'dist'
$script:JournalPath   = Join-Path $ReportsDir 'operations-journal.json'
$script:AdbLogPath    = Join-Path $ReportsDir 'adb-log.txt'
$script:PackageName   = 'com.cleartv.launcher'
$script:HomeComponent = 'com.cleartv.launcher/com.cleartv.launcher.ui.HomeActivity'
$script:Adb           = $null
$script:Serial        = $null
$script:OnWindows     = ($PSVersionTable.PSVersion.Major -lt 6) -or ((Get-Variable IsWindows -ErrorAction SilentlyContinue) -and $IsWindows)

# ------------------------------------------------------------------ console output
function Write-Step([string]$Text) { Write-Host ""; Write-Host "== $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text)   { Write-Host "  [OK]   $Text" -ForegroundColor Green }
function Write-Warn([string]$Text) { Write-Host "  [WARN] $Text" -ForegroundColor Yellow }
function Write-Fail([string]$Text) { Write-Host "  [FAIL] $Text" -ForegroundColor Red }
function Write-Info([string]$Text) { Write-Host "  $Text" }

# ------------------------------------------------------------------ files
function New-Dir([string]$Path) { if (-not (Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }; return $Path }
function Get-Timestamp { return (Get-Date -Format 'yyyyMMdd-HHmmss') }
function Write-Utf8File([string]$Path, [string]$Content) {
    New-Dir (Split-Path -Parent $Path) | Out-Null
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}
function Write-JsonFile([string]$Path, $Object) { Write-Utf8File $Path (ConvertTo-Json -InputObject $Object -Depth 16) }
function Read-JsonFile([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    return ($raw | ConvertFrom-Json)
}
function ConvertTo-MarkdownTable($Rows, [string[]]$Columns) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('| ' + ($Columns -join ' | ') + ' |')
    [void]$sb.AppendLine('|' + (($Columns | ForEach-Object { '---' }) -join '|') + '|')
    foreach ($row in @($Rows)) {
        $cells = foreach ($c in $Columns) {
            $v = $row.$c
            if ($null -eq $v) { '' } elseif ($v -is [System.Array]) { ($v -join '; ') } else { "$v" }
        }
        $cells = $cells | ForEach-Object { ($_ -replace '\|', '\|') -replace "`r?`n", ' ' }
        [void]$sb.AppendLine('| ' + ($cells -join ' | ') + ' |')
    }
    return $sb.ToString()
}

# ------------------------------------------------------------------ tool discovery
function Find-Adb {
    if ($env:CLEARTV_ADB -and (Test-Path -LiteralPath $env:CLEARTV_ADB)) { return $env:CLEARTV_ADB }
    $cmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $exe = if ($script:OnWindows) { 'adb.exe' } else { 'adb' }
    $roots = @()
    foreach ($r in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)) { if ($r) { $roots += $r } }
    if ($env:LOCALAPPDATA) { $roots += (Join-Path $env:LOCALAPPDATA 'Android\Sdk') }
    foreach ($r in $roots) { $p = Join-Path (Join-Path $r 'platform-tools') $exe; if (Test-Path -LiteralPath $p) { return $p } }
    $local = Join-Path (Join-Path (Join-Path $ProjectRoot 'tools') 'platform-tools') $exe
    if (Test-Path -LiteralPath $local) { return $local }
    return $null
}

function Install-PlatformTools([switch]$Yes) {
    # Official Google download only (Android SDK Platform Tools). Nothing else is fetched.
    $url  = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip'
    $dest = Join-Path $ProjectRoot 'tools'
    if (-not $Yes) {
        $answer = Read-Host "adb не найден. Скачать Android Platform Tools с $url в $dest ? [y/N]"
        if ($answer -notmatch '^[yYдД]') { return $null }
    }
    New-Dir $dest | Out-Null
    $zip = Join-Path $dest 'platform-tools.zip'
    Write-Info "Загрузка $url"
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    Remove-Item -LiteralPath $zip -Force
    $adb = Join-Path (Join-Path $dest 'platform-tools') 'adb.exe'
    if (Test-Path -LiteralPath $adb) { return $adb }
    return $null
}

function Get-JavaVersion {
    # Returns @{ Found; Major; Raw; Path }
    $result = [ordered]@{ Found = $false; Major = 0; Raw = ''; Path = '' }
    $java = $null
    if ($env:JAVA_HOME) {
        $candidate = Join-Path (Join-Path $env:JAVA_HOME 'bin') ($(if ($script:OnWindows) { 'java.exe' } else { 'java' }))
        if (Test-Path -LiteralPath $candidate) { $java = $candidate }
    }
    if (-not $java) { $cmd = Get-Command java -ErrorAction SilentlyContinue; if ($cmd) { $java = $cmd.Source } }
    if (-not $java) { return [pscustomobject]$result }
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $raw = (& $java -version 2>&1 | ForEach-Object { "$_" }) -join "`n"
    $ErrorActionPreference = $prev
    $result.Found = $true; $result.Raw = $raw; $result.Path = $java
    if ($raw -match 'version "(\d+)(?:\.(\d+))?') {
        $major = [int]$Matches[1]
        if ($major -eq 1 -and $Matches[2]) { $major = [int]$Matches[2] }
        $result.Major = $major
    }
    return [pscustomobject]$result
}

function Find-AndroidSdk {
    $candidates = @()
    foreach ($r in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)) { if ($r) { $candidates += $r } }
    $lp = Join-Path $ProjectRoot 'local.properties'
    if (Test-Path -LiteralPath $lp) {
        foreach ($line in Get-Content -LiteralPath $lp) {
            if ($line -match '^\s*sdk\.dir\s*=\s*(.+)$') { $candidates += ($Matches[1].Trim() -replace '\\\\', '\' -replace '\\:', ':') }
        }
    }
    if ($env:LOCALAPPDATA) { $candidates += (Join-Path $env:LOCALAPPDATA 'Android\Sdk') }
    foreach ($c in $candidates) { if ($c -and (Test-Path -LiteralPath $c)) { return $c } }
    return $null
}

# ------------------------------------------------------------------ adb
function Initialize-Adb {
    param([string]$Address, [string]$Serial, [switch]$AutoInstallTools)
    $script:Adb = Find-Adb
    if (-not $script:Adb -and $AutoInstallTools) { $script:Adb = Install-PlatformTools -Yes }
    if (-not $script:Adb) { $script:Adb = Install-PlatformTools }
    if (-not $script:Adb) { throw "adb не найден. Установите Android SDK Platform Tools (https://developer.android.com/tools/releases/platform-tools) или запустите с -AutoInstallTools." }
    New-Dir $ReportsDir | Out-Null
    Write-Info "adb: $($script:Adb)"
    Invoke-Adb start-server | Out-Null
    if ($Serial) { $script:Serial = $Serial }
    if ($Address) { if (-not (Connect-Tv $Address)) { throw "Не удалось подключиться к $Address. Проверьте, что на телевизоре включена отладка по сети (ADB) и устройство в той же сети." } }
    return $script:Adb
}

function Invoke-Adb {
    # Deliberately a simple (non-advanced) function: adb switches such as -p, -r, -t, -l, -d must reach adb
    # untouched instead of being matched against PowerShell's common parameters.
    $argv = @()
    if ($script:Serial) { $argv += @('-s', $script:Serial) }
    foreach ($a in $args) { $argv += [string]$a }
    $started = Get-Date
    $ErrorActionPreference = 'Continue'   # native stderr must not terminate the script (PS 5.1 quirk)
    $output = @(& $script:Adb @argv 2>&1 | ForEach-Object { "$_" })
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    $text = ($output -join "`n").TrimEnd()
    try {
        $ms = [int]((Get-Date) - $started).TotalMilliseconds
        Add-Content -LiteralPath $AdbLogPath -Encoding UTF8 -Value ("[{0}] adb {1}  (exit {2}, {3} ms)`n{4}`n" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), ($argv -join ' '), $code, $ms, $text)
    } catch { }
    return [pscustomobject]@{ Output = $text; Lines = $output; ExitCode = $code; Command = ('adb ' + ($argv -join ' ')) }
}
function Invoke-AdbShell([string]$Command) { return (Invoke-Adb shell $Command) }
function Get-ShellText([string]$Command) { return (Invoke-Adb shell $Command).Output }

function Connect-Tv([string]$Address) {
    if ($Address -notmatch ':\d+$') { $Address = "${Address}:5555" }
    $r = Invoke-Adb connect $Address
    Write-Info $r.Output
    if ($r.Output -match 'connected to') { $script:Serial = $Address; return $true }
    return $false
}

function Get-Devices {
    $r = Invoke-Adb devices -l
    $list = @()
    foreach ($line in $r.Lines) {
        if ($line -match '^(\S+)\s+(device|offline|unauthorized|authorizing)\b(.*)$') {
            $model = ''
            if ($Matches[3] -match 'model:(\S+)') { $model = $Matches[1] }
            $list += [pscustomobject]@{ Serial = $Matches[1]; State = $Matches[2]; Model = $model }
        }
    }
    return $list
}

function Select-Device {
    if ($script:Serial) { return $script:Serial }
    $devices = @(Get-Devices)
    $ready = @($devices | Where-Object { $_.State -eq 'device' })
    if ($ready.Count -eq 1) { $script:Serial = $ready[0].Serial; return $script:Serial }
    if ($ready.Count -gt 1) { throw "Подключено несколько устройств ($($ready.Serial -join ', ')): укажите -Serial." }
    $unauth = @($devices | Where-Object { $_.State -ne 'device' })
    if ($unauth.Count -gt 0) {
        Write-Warn "Устройство $($unauth[0].Serial) в состоянии '$($unauth[0].State)'. На экране телевизора подтвердите запрос «Разрешить отладку» (отметьте «Всегда»). Ожидание до 120 с..."
        $deadline = (Get-Date).AddSeconds(120)
        while ((Get-Date) -lt $deadline) {
            Pause-Ms 3000
            $ready = @(Get-Devices | Where-Object { $_.State -eq 'device' })
            if ($ready.Count -ge 1) { $script:Serial = $ready[0].Serial; Write-Ok "Авторизовано: $($script:Serial)"; return $script:Serial }
        }
        throw "Устройство найдено, но не авторизовано ($($unauth[0].Serial): $($unauth[0].State)). Подтвердите запрос отладки на экране телевизора и запустите снова."
    }
    throw "Устройства не найдены. Укажите адрес телевизора: -Ip 192.168.x.x (ADB по сети должен быть включён в настройках разработчика)."
}

function Wait-ForDevice([int]$TimeoutSec = 180) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $state = (Invoke-Adb get-state).Output.Trim()
        if ($state -eq 'device') {
            $booted = (Get-ShellText 'getprop sys.boot_completed').Trim()
            if ($booted -eq '1') { return $true }
        } elseif ($script:Serial -and $script:Serial -match ':\d+$') {
            Invoke-Adb connect $script:Serial | Out-Null
        }
        Pause-Ms 3000
    }
    return $false
}

function Get-Prop([string]$Name) { return (Get-ShellText "getprop $Name").Trim() }

function Pause-Ms([int]$Ms) {
    # All waits go through here so the script tests can run with CLEARTV_TIME_SCALE=0.02
    $scale = 1.0
    if ($env:CLEARTV_TIME_SCALE) { $scale = [double]$env:CLEARTV_TIME_SCALE }
    $v = [int]($Ms * $scale)
    if ($v -gt 0) { Start-Sleep -Milliseconds $v }
}
function Send-Key([string]$Key, [switch]$LongPress, [int]$SettleMs = 450) {
    if ($LongPress) { Invoke-Adb shell input keyevent --longpress $Key | Out-Null } else { Invoke-Adb shell input keyevent $Key | Out-Null }
    Pause-Ms $SettleMs
}

# ------------------------------------------------------------------ parsers (pure; unit-tested with fixtures)
function ConvertFrom-GetProp([string]$Text) {
    $props = @{}
    foreach ($line in ($Text -split "`r?`n")) {
        if ($line -match '^\[(.+?)\]:\s*\[(.*)\]$') { $props[$Matches[1]] = $Matches[2] }
    }
    return $props
}

function ConvertFrom-PackageList([string]$Text) {
    # "package:/path/base.apk=com.example" or "package:com.example"
    $list = @()
    foreach ($line in ($Text -split "`r?`n")) {
        if ($line -match '^package:(?:(.+)=)?([A-Za-z0-9_.]+)\s*$') { $list += [pscustomobject]@{ Package = $Matches[2]; Path = $Matches[1] } }
    }
    return $list
}

function ConvertFrom-BriefComponents([string]$Text) {
    # output of `cmd package query-activities --brief ...` / resolve-activity --brief: lines like "com.pkg/.Activity"
    $items = @()
    foreach ($line in ($Text -split "`r?`n")) {
        $t = $line.Trim()
        if ($t -match '^([A-Za-z0-9_.]+)/(\S+)$') { $items += $t }
    }
    return $items
}

function Get-ResumedActivity {
    $text = Get-ShellText 'dumpsys activity activities'
    foreach ($pattern in @('topResumedActivity=ActivityRecord\{[^}]*?\s(\S+/\S+?)\s', 'mResumedActivity: ActivityRecord\{[^}]*?\s(\S+/\S+?)\s', 'ResumedActivity: ActivityRecord\{[^}]*?\s(\S+/\S+?)\s')) {
        if ($text -match $pattern) { return $Matches[1] }
    }
    $win = Get-ShellText 'dumpsys window'
    if ($win -match 'mCurrentFocus=Window\{[^}]*?\s(\S+/\S+?)\}') { return $Matches[1] }
    return $null
}

function Get-ResolvedHome {
    $r = Invoke-AdbShell 'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME'
    $comps = @(ConvertFrom-BriefComponents $r.Output)   # @() keeps a single result an array (PowerShell unrolls it otherwise)
    if ($comps.Count -gt 0) { return $comps[-1] }
    return $null
}

function Get-HomeCandidates {
    $r = Invoke-AdbShell 'cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.HOME'
    return @(ConvertFrom-BriefComponents $r.Output)
}

function Test-SetHomeActivitySupported {
    $help = Get-ShellText 'cmd package help'
    return ($help -match 'set-home-activity')
}

function ConvertFrom-MemInfoPss([string]$Text) {
    # dumpsys meminfo <pkg>: "TOTAL PSS:  45678" (newer) or "TOTAL   45678" row
    if ($Text -match 'TOTAL PSS:\s+(\d+)') { return [int]$Matches[1] }
    if ($Text -match '(?m)^\s*TOTAL\s+(\d+)') { return [int]$Matches[1] }
    return $null
}

function ConvertFrom-GfxInfo([string]$Text) {
    $r = [ordered]@{ TotalFrames = $null; JankyFrames = $null; JankyPercent = $null; P50 = $null; P90 = $null; P95 = $null; P99 = $null }
    if ($Text -match 'Total frames rendered:\s+(\d+)') { $r.TotalFrames = [int]$Matches[1] }
    if ($Text -match 'Janky frames:\s+(\d+)\s+\(([\d.]+)%\)') { $r.JankyFrames = [int]$Matches[1]; $r.JankyPercent = [double]$Matches[2] }
    if ($Text -match '50th percentile:\s+(\d+)ms') { $r.P50 = [int]$Matches[1] }
    if ($Text -match '90th percentile:\s+(\d+)ms') { $r.P90 = [int]$Matches[1] }
    if ($Text -match '95th percentile:\s+(\d+)ms') { $r.P95 = [int]$Matches[1] }
    if ($Text -match '99th percentile:\s+(\d+)ms') { $r.P99 = [int]$Matches[1] }
    return [pscustomobject]$r
}

function ConvertFrom-TvInputDump([string]$Text) {
    # dumpsys tv_input: AOSP prints "TvInputInfo{id=com.x/.Service/HW1, type=HDMI, ...}"; Salute TV (Android 13) prints
    # "<id>: info: TvInputInfo{id=..., pkg=..., service=...}; state: 1" with no type. The type is then inferred from the
    # service class name: Hdmi*/AV*/Component/... are physical (passthrough) inputs; Dtvkit/ADTV/DTV/ATV are tuners and
    # must not be offered as "HDMI" (seen on a real at30a6: the tuner came first in the list and carried /HW19).
    $inputs = @()
    $seen = @{}
    foreach ($m in [regex]::Matches($Text, 'TvInputInfo\{([^}]*)\}(?:;\s*state:\s*(\d+))?')) {
        $body = $m.Groups[1].Value
        $id = ''; $type = ''; $service = ''
        if ($body -match 'id=([^,}]+)') { $id = $Matches[1].Trim() }
        if (-not $id -or $seen.ContainsKey($id)) { continue }
        $seen[$id] = $true
        if ($body -match 'type=([^,}]+)') { $type = $Matches[1].Trim() }
        if ($body -match 'service=([^,}]+)') { $service = $Matches[1].Trim() } else { $service = $id }
        if (-not $type) {
            $cls = ($service -split '\.')[-1]            # class name only: the package may be called *.hdmi for every input
            $type = switch -Regex ($cls) {
                'hdmi' { 'HDMI'; break }
                '^(av|cvbs)\d*input|composite' { 'COMPOSITE'; break }
                'component|ypbpr' { 'COMPONENT'; break }
                'scart' { 'SCART'; break }
                'vga' { 'VGA'; break }
                'dvi' { 'DVI'; break }
                'displayport' { 'DISPLAY_PORT'; break }
                'dtvkit|adtv|dtv|atv|tuner|dvb|atsc|isdb' { 'TUNER'; break }
                default { if ($id -match '/HW\d+') { 'OTHER_HW' } else { '' } }
            }
        }
        $state = $null; if ($m.Groups[2].Success) { $state = [int]$m.Groups[2].Value }   # 0 connected, 1 standby, 2 disconnected
        $inputs += [pscustomobject]@{ Id = $id; Type = $type; Service = $service; State = $state; Passthrough = ($type -match '^(HDMI|COMPONENT|COMPOSITE|SCART|VGA|DVI|SVIDEO|DISPLAY_PORT)$') }
    }
    return $inputs
}

function Test-HdmiCecEnabled([string]$Text) {
    # dumpsys hdmi_control: Android <= 11 prints "mHdmiControlEnabled: true"; Android 12+ lists
    # "hdmi_cec_enabled (int): 1 (default: 0)" under "CEC settings:" (seen on Salute TV at30a6, Android 13).
    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    if ($Text -match 'hdmi_cec_enabled \(int\):\s*(\d)') { return ($Matches[1] -eq '1') }
    if ($Text -match 'mHdmiControlEnabled[:=]\s*(true|false)') { return ($Matches[1] -eq 'true') }
    return [bool]($Text -match 'HDMI control enabled: true|hdmi_control_enabled[:=]\s*1')
}

function ConvertFrom-LogcatEvents([string]$Text, [string]$Marker) {
    # Returns EVT lines emitted by ClearTV after the marker line (or all when no marker).
    $events = @()
    $after = [string]::IsNullOrEmpty($Marker)
    foreach ($line in ($Text -split "`r?`n")) {
        if (-not $after) { if ($line -match [regex]::Escape($Marker)) { $after = $true }; continue }
        if ($line -match 'EVT (\S+)(.*)$') {
            $fields = @{}
            foreach ($kv in [regex]::Matches($Matches[2], '(\w+)=(\S+)')) { $fields[$kv.Groups[1].Value] = $kv.Groups[2].Value }
            $events += [pscustomobject]@{ Name = $Matches[1]; Fields = $fields; Line = $line }
        }
    }
    return $events
}

function Send-Marker {
    $id = [guid]::NewGuid().ToString('N').Substring(0, 12)
    Invoke-Adb shell log -t ClearTV "MARK $id" | Out-Null
    return "MARK $id"
}
function Get-EventsSince([string]$Marker) {
    $text = (Invoke-Adb logcat -d -s 'ClearTV:*').Output
    return @(ConvertFrom-LogcatEvents $text $Marker)
}

# ------------------------------------------------------------------ device health (after every change)
function Test-DeviceHealth([string]$ExpectedHome) {
    # Returns $null when fine, otherwise a human-readable problem (mirrors TV-Cleaner-for-Salute's HealthCheck).
    if ((Get-ShellText 'echo ok').Trim() -ne 'ok') { return 'телевизор не отвечает на команды' }
    $resolved = Get-ResolvedHome
    if (-not $resolved) { return 'на телевизоре не осталось главного экрана (HOME не резолвится)' }
    if ($ExpectedHome -and $resolved -ne $ExpectedHome) { return "сменился главный экран: теперь $resolved" }
    $conn = Get-ShellText 'dumpsys connectivity'
    if ($conn -and $conn -notmatch 'CONNECTED/CONNECTED') { return 'телевизор потерял сеть' }
    return $null
}
function Get-SecureSetting([string]$Key) { $v = (Get-ShellText "settings get secure $Key").Trim(); if ($v -eq 'null') { '' } else { $v } }
function Get-GlobalSetting([string]$Key) { $v = (Get-ShellText "settings get global $Key").Trim(); if ($v -eq 'null') { '' } else { $v } }
function Get-RestoreSettingCommand([string]$Namespace, [string]$Key, [string]$Previous) {
    if ([string]::IsNullOrEmpty($Previous)) { return "settings delete $Namespace $Key" }
    return "settings put $Namespace $Key '$Previous'"
}

# ------------------------------------------------------------------ operations journal
function Read-Journal {
    $j = Read-JsonFile $JournalPath
    if ($null -eq $j) { return @() }
    return @($j)
}
function Add-JournalEntry {
    param([string]$Action, [string]$Description, [string]$Command, [string]$RestoreCommand, $Previous, $New, [string]$Verify)
    $entries = @(Read-Journal)
    $entry = [pscustomobject]@{
        Id = [guid]::NewGuid().ToString(); Time = (Get-Date).ToString('o'); Serial = $script:Serial
        Action = $Action; Description = $Description; Command = $Command; RestoreCommand = $RestoreCommand
        Previous = $Previous; New = $New; Verify = $Verify; Restored = $false; RestoredAt = $null
    }
    $entries += $entry
    Write-JsonFile $JournalPath $entries
    return $entry
}
function Set-JournalRestored([string]$Id) {
    $entries = @(Read-Journal)
    foreach ($e in $entries) { if ($e.Id -eq $Id) { $e.Restored = $true; $e.RestoredAt = (Get-Date).ToString('o') } }
    Write-JsonFile $JournalPath $entries
}
function Get-PendingJournal { return @(Read-Journal | Where-Object { -not $_.Restored }) }

# ------------------------------------------------------------------ package inventory
function ConvertFrom-DumpsysPackages([string]$Text) {
    # Parses `dumpsys package packages` into one object per package.
    $result = @()
    $start = $Text.IndexOf("Packages:")
    if ($start -lt 0) { return $result }
    $body = $Text.Substring($start)
    foreach ($stop in @("`nHidden system packages:", "`nShared users:", "`nRenamed packages:")) { $i = $body.IndexOf($stop); if ($i -gt 0) { $body = $body.Substring(0, $i) } }
    $blocks = [regex]::Split($body, '(?m)^  Package \[')
    foreach ($block in $blocks) {
        if ($block -notmatch '^([A-Za-z0-9_.]+)\]') { continue }
        $pkg = $Matches[1]
        $o = [ordered]@{ Package = $pkg; VersionName = ''; TargetSdk = 0; CodePath = ''; SharedUser = ''; Flags = ''; PrivateFlags = ''; Enabled = 'unknown'; Installed = $true; GrantedPermissions = @(); OverlayTarget = '' }
        if ($block -match '(?m)^\s+versionName=(.*)$') { $o.VersionName = $Matches[1].Trim() }
        if ($block -match 'targetSdk=(\d+)') { $o.TargetSdk = [int]$Matches[1] }
        if ($block -match '(?m)^\s+codePath=(.*)$') { $o.CodePath = $Matches[1].Trim() }
        if ($block -match 'sharedUser=.*?(android\.uid\.[A-Za-z0-9_.]+|name=([A-Za-z0-9_.]+))') { $o.SharedUser = $(if ($Matches[2]) { $Matches[2] } else { $Matches[1] }) }
        if ($block -match '(?m)^\s+flags=\[(.*?)\]') { $o.Flags = $Matches[1].Trim() }
        if ($block -match '(?m)^\s+privateFlags=\[(.*?)\]') { $o.PrivateFlags = $Matches[1].Trim() }
        if ($block -match '(?m)^\s+overlayTarget=(\S+)') { $t = $Matches[1].Trim(); if ($t -ne 'null') { $o.OverlayTarget = $t } }
        if ($block -match 'User 0:.*?installed=(true|false).*?enabled=(\d)') {
            $o.Installed = ($Matches[1] -eq 'true')
            $o.Enabled = switch ($Matches[2]) { '0' { 'default' } '1' { 'enabled' } '2' { 'disabled' } '3' { 'disabled-user' } '4' { 'disabled-until-used' } default { 'unknown' } }
        }
        $perms = @()
        if ($block -match '(?s)install permissions:(.*?)(?:\n\s*User \d+:|\n\s*\S+ permissions:|\z)') {
            foreach ($pm in [regex]::Matches($Matches[1], '(android\.permission\.[A-Z_]+): granted=true')) { $perms += $pm.Groups[1].Value }
        }
        $o.GrantedPermissions = $perms
        $result += [pscustomobject]$o
    }
    return $result
}

$script:CoreSystemPackages = @(
    'android', 'com.android.systemui', 'com.android.settings', 'com.android.tv.settings', 'com.android.providers.settings',
    'com.android.providers.media', 'com.android.providers.media.module', 'com.android.providers.downloads', 'com.android.providers.tv',
    'com.android.providers.contacts', 'com.android.providers.calendar', 'com.android.providers.userdictionary', 'com.android.providers.blockednumber',
    'com.android.shell', 'com.android.packageinstaller', 'com.android.permissioncontroller', 'com.android.bluetooth', 'com.android.bluetoothmidiservice',
    'com.android.inputdevices', 'com.android.keychain', 'com.android.certinstaller', 'com.android.location.fused', 'com.android.externalstorage',
    'com.android.documentsui', 'com.android.se', 'com.android.dynsystem', 'com.android.localtransport', 'com.android.backupconfirm',
    'com.android.server.telecom', 'com.android.phone', 'com.android.mtp', 'com.android.proxyhandler', 'com.android.captiveportallogin',
    'com.android.networkstack', 'com.android.networkstack.permissionconfig', 'com.android.networkstack.tethering', 'com.android.wifi.resources',
    'com.android.cellbroadcastreceiver', 'com.android.statementservice', 'com.android.sharedstoragebackup', 'com.android.webview', 'com.google.android.webview',
    'com.android.tv', 'com.android.tv.frameworkpackagestubs', 'com.android.pacprocessor', 'com.android.carrierconfig', 'com.android.vpndialogs',
    'com.android.settings.intelligence', 'com.android.hdmicec' , 'com.android.ons', 'com.android.printspooler', 'com.android.managedprovisioning',
    'android.ext.services', 'android.ext.shared'
)
$script:VendorPrefixes = @('com.droidlogic.', 'com.amlogic.', 'com.mediatek.', 'com.mtk.', 'com.realtek.', 'com.rtk.', 'com.mstar.', 'com.novatek.', 'com.hisilicon.', 'com.hikeen.', 'com.allwinner.', 'com.rockchip.', 'com.qualcomm.', 'vendor.', 'com.qti.')
$script:SystemSharedUids = @('android.uid.system', 'android.uid.phone', 'android.uid.bluetooth', 'android.uid.nfc', 'android.uid.networkstack', 'android.uid.shell', 'android.uid.se', 'android.uid.systemui')
$script:KnowledgeBasePath = Join-Path (Join-Path $PSScriptRoot 'data') 'salute-packages.json'
$script:KnowledgeBase = $null
$script:ClearTvDream = 'com.cleartv.launcher/com.cleartv.launcher.dream.ClearDream'
$script:ClearTvGuard = 'com.cleartv.launcher/com.cleartv.launcher.guard.HomeGuardService'

function Get-KnowledgeBase {
    if ($null -eq $script:KnowledgeBase) {
        $kb = Read-JsonFile $script:KnowledgeBasePath
        $map = @{}
        if ($kb) { foreach ($e in @($kb.packages)) { $map[$e.id] = $e } }
        $script:KnowledgeBase = @{ Raw = $kb; Map = $map }
    }
    return $script:KnowledgeBase
}
function Get-KnownPackage([string]$Package) { return (Get-KnowledgeBase).Map[$Package] }

$script:PowerPermissions = @('android.permission.INSTALL_PACKAGES', 'android.permission.DELETE_PACKAGES', 'android.permission.REBOOT', 'android.permission.MASTER_CLEAR', 'android.permission.RECOVERY', 'android.permission.WRITE_SECURE_SETTINGS', 'android.permission.MANAGE_DEVICE_ADMINS', 'android.permission.UPDATE_DEVICE_STATS')

function Get-PackageCategory {
    # $Info: object from ConvertFrom-DumpsysPackages (+ optional .ThirdParty). $Context: hashtable with sets built from the device:
    #   LeanbackPkgs, LauncherPkgs, HomePkgs, TvInputPkgs, ImePkgs, VoicePkgs, BootPkgs, PassthroughPkgs, CurrentHome, ThirdPartyPkgs, ObservedOnScreen
    param($Info, [hashtable]$Context)
    $pkg = $Info.Package
    $reasons = @()
    $isSystem = ($Info.Flags -match '\bSYSTEM\b') -or ($Info.CodePath -match '^/(system|vendor|product|odm|oem|system_ext)/')
    $isThirdParty = ($Context.ThirdPartyPkgs -contains $pkg) -or (-not $isSystem)
    $hasLauncher = ($Context.LeanbackPkgs -contains $pkg) -or ($Context.LauncherPkgs -contains $pkg)
    $critical = $false

    if ($pkg -eq $Context.CurrentHome) { $critical = $true; $reasons += 'текущий HOME-лаунчер (не отключать, пока ClearTV не проверен)' }
    if ($script:CoreSystemPackages -contains $pkg) { $critical = $true; $reasons += 'базовый компонент AOSP' }
    foreach ($p in $script:VendorPrefixes) { if ($pkg.StartsWith($p)) { $critical = $true; $reasons += 'пакет производителя SoC/платформы (драйверы, HDMI, тюнер)' ; break } }
    if ($Info.OverlayTarget) { $critical = $true; $reasons += "RRO-оверлей ресурсов для '$($Info.OverlayTarget)' (кода нет; задаёт настройки прошивки)" }
    if ($Info.CodePath -match '^/apex/') { $critical = $true; $reasons += 'модуль Mainline (APEX) — часть системы' }
    if ($Info.SharedUser -and ($script:SystemSharedUids -contains $Info.SharedUser)) { $critical = $true; $reasons += "sharedUserId=$($Info.SharedUser)" }
    if ($Context.TvInputPkgs -contains $pkg) { $critical = $true; $reasons += 'предоставляет TvInputService (HDMI/тюнер)' }
    if ($Context.PassthroughPkgs -contains $pkg) { $critical = $true; $reasons += 'обрабатывает переключение на HDMI-вход' }
    if ($Context.ImePkgs -contains $pkg) { $critical = $true; $reasons += 'клавиатура (IME)' }
    if ($Context.VoicePkgs -contains $pkg) { $critical = $true; $reasons += 'голосовой сервис (VoiceInteractionService)' }
    $power = @($Info.GrantedPermissions | Where-Object { $script:PowerPermissions -contains $_ })
    if ($power.Count -gt 0) { $critical = $true; $reasons += ('системные привилегии: ' + (($power | ForEach-Object { $_ -replace 'android.permission.', '' }) -join ', ')) }
    if ($Info.Flags -match '\bPERSISTENT\b') { $critical = $true; $reasons += 'persistent-процесс' }
    if ($pkg -match '^com\.android\.' -and $isSystem -and -not $hasLauncher) { $critical = $true; $reasons += 'системный компонент com.android.* без пользовательского интерфейса' }

    # Knowledge base: entries confirmed by package lists from real Salute TV devices (scripts/data/salute-packages.json)
    $known = Get-KnownPackage $pkg
    $knownTitle = ''; $knownBreaks = ''; $knownSources = ''
    if ($known) {
        $knownTitle = [string]$known.title; $knownBreaks = [string]$known.breaks; $knownSources = (@($known.sources) -join ', ')
        if ($known.action -eq 'keep') { $critical = $true; $reasons += "база знаний ($knownSources): $knownTitle — не трогать" }
    }

    $category = 'UNKNOWN'
    if ($critical) { $category = 'CRITICAL' }
    elseif ($known -and $known.action -eq 'disable') { $category = 'PROMOTIONAL'; $reasons += "база знаний ($knownSources): $knownTitle ($($known.group))" }
    elseif ($known -and $known.action -eq 'ask') { $category = 'OPTIONAL'; $reasons += "база знаний ($knownSources): $knownTitle — по желанию" }
    elseif ($isThirdParty) { $category = 'OPTIONAL'; $reasons += 'установлено пользователем (не из прошивки)' }
    elseif ($hasLauncher) { $category = 'OPTIONAL'; $reasons += 'пользовательское приложение из прошивки с собственной иконкой' }
    else { $reasons += 'назначение не установлено по структурным признакам — требуется проверка на устройстве' }

    if ($Context.ObservedOnScreen -contains $pkg -and $category -ne 'CRITICAL' -and $category -ne 'PROMOTIONAL') { $reasons += 'наблюдался на экране при фиксации рекламного блока (см. reports/focus-captures.json)'; $category = 'PROMOTIONAL-CANDIDATE' }
    if ($Context.BootPkgs -contains $pkg) { $reasons += 'стартует при загрузке (BOOT_COMPLETED)' }

    $disable = ''; $restore = ''; $risk = 'Unknown'; $consequence = ''
    switch ($category) {
        'CRITICAL' { $risk = 'High'; $consequence = $(if ($knownBreaks) { "Не изменять. При отключении: $knownBreaks" } else { 'Потеря базовых функций (настройки, входы, сеть, звук, пульт, обновления) или циклическая перезагрузка. Не изменять.' }) }
        'PROMOTIONAL' { $risk = 'Low'; $disable = "pm disable-user --user 0 $pkg"; $restore = "pm enable $pkg"; $consequence = $(if ($knownBreaks) { "Реклама/телеметрия/мусор по отчётам с устройств. Перестанет работать: $knownBreaks. Обратимо (pm enable)." } else { 'Реклама/телеметрия/мусор по отчётам с устройств. Обратимо (pm enable).' }) }
        'OPTIONAL' {
            $risk = 'Low'
            if ($isThirdParty) { $disable = "pm uninstall -k --user 0 $pkg"; $restore = "cmd package install-existing $pkg"; $consequence = 'Приложение исчезнет из списка; данные сохранятся (-k).' }
            else { $disable = "pm disable-user --user 0 $pkg"; $restore = "pm enable $pkg"; $consequence = $(if ($knownBreaks) { "Отключать только по желанию. Перестанет работать: $knownBreaks. Обратимо." } else { 'Приложение скрыто и не запускается; фоновые сервисы пакета остановлены. Обратимо.' }) }
        }
        'PROMOTIONAL-CANDIDATE' { $risk = 'Medium'; $disable = "pm disable-user --user 0 $pkg"; $restore = "pm enable $pkg"; $consequence = 'Кандидат: отключать только после подтверждения, что это рекламный компонент без зависимостей.' }
        default { $risk = 'Unknown'; $consequence = 'Назначение не подтверждено. Не изменять до проверки.' }
    }
    return [pscustomobject]@{ Category = $category; Reasons = $reasons; Risk = $risk; DisableCommand = $disable; RestoreCommand = $restore; Consequence = $consequence; System = $isSystem; HasLauncher = $hasLauncher; Known = $knownTitle; Breaks = $knownBreaks; Sources = $knownSources }
}

function Get-DeviceInventory {
    # Collects everything needed for classification from the connected device. Returns @{ Packages=[...]; Context=@{...}; Raw=@{...} }
    $raw = @{}
    $raw.PackagesF     = Get-ShellText 'pm list packages -f'
    $raw.PackagesThird = Get-ShellText 'pm list packages -3'
    $raw.PackagesDis   = Get-ShellText 'pm list packages -d'
    $raw.Dumpsys       = Get-ShellText 'dumpsys package packages'
    $raw.Leanback      = Get-ShellText 'cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LEANBACK_LAUNCHER'
    $raw.Launcher      = Get-ShellText 'cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER'
    $raw.Home          = Get-ShellText 'cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.HOME'
    $raw.MainAny       = Get-ShellText 'cmd package query-activities --brief -a android.intent.action.MAIN'
    $raw.TvInput       = Get-ShellText 'cmd package query-services --brief -a android.media.tv.TvInputService'
    $raw.Voice         = Get-ShellText 'cmd package query-services --brief -a android.service.voice.VoiceInteractionService'
    $raw.Boot          = Get-ShellText 'cmd package query-receivers --brief -a android.intent.action.BOOT_COMPLETED'
    $raw.Passthrough   = Get-ShellText 'cmd package query-activities --brief -a android.intent.action.VIEW -d content://android.media.tv/passthrough/probe'
    $raw.Ime           = Get-ShellText 'ime list -a -s'
    $raw.ResolvedHome  = Get-ShellText 'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME'

    $pkgOf = { param($comps) @($comps | ForEach-Object { ($_ -split '/')[0] } | Select-Object -Unique) }
    $ctx = @{
        LeanbackPkgs = & $pkgOf (ConvertFrom-BriefComponents $raw.Leanback)
        LauncherPkgs = & $pkgOf (ConvertFrom-BriefComponents $raw.Launcher)
        HomePkgs     = & $pkgOf (ConvertFrom-BriefComponents $raw.Home)
        MainAnyPkgs  = & $pkgOf (ConvertFrom-BriefComponents $raw.MainAny)
        TvInputPkgs  = & $pkgOf (ConvertFrom-BriefComponents $raw.TvInput)
        VoicePkgs    = & $pkgOf (ConvertFrom-BriefComponents $raw.Voice)
        BootPkgs     = & $pkgOf (ConvertFrom-BriefComponents $raw.Boot)
        PassthroughPkgs = & $pkgOf (ConvertFrom-BriefComponents $raw.Passthrough)
        ImePkgs      = & $pkgOf (ConvertFrom-BriefComponents $raw.Ime)
        ThirdPartyPkgs = @((ConvertFrom-PackageList $raw.PackagesThird) | ForEach-Object { $_.Package })
        DisabledPkgs = @((ConvertFrom-PackageList $raw.PackagesDis) | ForEach-Object { $_.Package })
        CurrentHome  = $null
        ObservedOnScreen = @()
    }
    $resolvedHome = @(ConvertFrom-BriefComponents $raw.ResolvedHome)
    if ($resolvedHome.Count -gt 0) { $ctx.CurrentHome = ($resolvedHome[-1] -split '/')[0] }
    $captures = Read-JsonFile (Join-Path $ReportsDir 'focus-captures.json')
    if ($captures) { $ctx.ObservedOnScreen = @($captures | ForEach-Object { $_.Package } | Where-Object { $_ } | Select-Object -Unique) }

    $infos = ConvertFrom-DumpsysPackages $raw.Dumpsys
    $paths = @{}; foreach ($p in (ConvertFrom-PackageList $raw.PackagesF)) { $paths[$p.Package] = $p.Path }
    $rows = @()
    foreach ($info in $infos) {
        $c = Get-PackageCategory -Info $info -Context $ctx
        $rows += [pscustomobject]@{
            Package = $info.Package; Category = $c.Category; Risk = $c.Risk; System = $c.System
            Enabled = $(if ($ctx.DisabledPkgs -contains $info.Package) { 'disabled' } else { $info.Enabled })
            Version = $info.VersionName; TargetSdk = $info.TargetSdk; Path = $(if ($paths[$info.Package]) { $paths[$info.Package] } else { $info.CodePath })
            SharedUser = $info.SharedUser
            Launcher = $(if ($ctx.LeanbackPkgs -contains $info.Package) { 'leanback' } elseif ($ctx.LauncherPkgs -contains $info.Package) { 'launcher' } elseif ($ctx.MainAnyPkgs -contains $info.Package -and $ctx.HomePkgs -notcontains $info.Package) { 'main-only (vendor category, e.g. STAR_LAUNCHER)' } else { '' })
            Home = ($ctx.HomePkgs -contains $info.Package)
            Known = $c.Known; Breaks = $c.Breaks; Sources = $c.Sources
            Reasons = $c.Reasons; DisableCommand = $c.DisableCommand; RestoreCommand = $c.RestoreCommand; Consequence = $c.Consequence
        }
    }
    return @{ Packages = ($rows | Sort-Object Category, Package); Context = $ctx; Raw = $raw }
}

function Format-InventoryMarkdown($Inventory, [string]$DeviceTitle) {
    $rows = @($Inventory.Packages)
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# Инвентаризация пакетов — $DeviceTitle")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("Сформировано: $(Get-Date -Format 'yyyy-MM-dd HH:mm'). Всего пакетов: $($rows.Count).")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("Классификация выполнена по **структурным признакам** (sharedUserId, объявленные сервисы, привилегии, наличие иконки, принадлежность прошивке) и по **базе знаний** scripts/data/salute-packages.json, где каждая запись подтверждена списком пакетов с реального Салют ТВ (источники указаны в колонке Reasons). PROMOTIONAL — реклама, телеметрия и мусор по этим отчётам (отключаются clean.ps1, обратимо). PROMOTIONAL-CANDIDATE — компоненты, зафиксированные на экране при показе рекламы (`diagnose.ps1 -Capture`). Пакеты CRITICAL и UNKNOWN не изменяются.")
    [void]$sb.AppendLine("")
    foreach ($cat in @('CRITICAL', 'PROMOTIONAL', 'OPTIONAL', 'PROMOTIONAL-CANDIDATE', 'UNKNOWN')) {
        $subset = @($rows | Where-Object { $_.Category -eq $cat })
        [void]$sb.AppendLine("## $cat ($($subset.Count))")
        [void]$sb.AppendLine("")
        if ($subset.Count -eq 0) { [void]$sb.AppendLine("_нет_"); [void]$sb.AppendLine(""); continue }
        [void]$sb.Append((ConvertTo-MarkdownTable $subset @('Package', 'Known', 'Version', 'Enabled', 'Launcher', 'Reasons', 'Breaks', 'Risk', 'DisableCommand', 'RestoreCommand', 'Consequence')))
        [void]$sb.AppendLine("")
    }
    return $sb.ToString()
}
