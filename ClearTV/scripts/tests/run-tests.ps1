# ClearTV script tests. Runs on PowerShell 7 (Linux/macOS/Windows) with a fake adb; no device needed.
#   pwsh scripts/tests/run-tests.ps1
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$scripts = Split-Path -Parent $here
$root = Split-Path -Parent $scripts
$failures = 0; $passed = 0
function Check([string]$Name, [bool]$Condition, [string]$Info = '') {
    if ($Condition) { $script:passed++; Write-Host "  PASS  $Name" -ForegroundColor Green } else { $script:failures++; Write-Host "  FAIL  $Name $Info" -ForegroundColor Red }
}

Write-Host "== 1. Syntax of every script"
foreach ($f in Get-ChildItem $scripts -Filter '*.ps1') {
    $tokens = $null; $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($f.FullName, [ref]$tokens, [ref]$errors) | Out-Null
    Check "parse $($f.Name)" ($errors.Count -eq 0) (($errors | ForEach-Object { $_.Message }) -join '; ')
}

Write-Host "== 2. Pure parsers and classification (common.ps1)"
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("cleartv-tests-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports'
$env:CLEARTV_ADB = Join-Path (Join-Path $here 'fake-adb') 'adb'
$env:CLEARTV_FAKE_FIXTURES = Join-Path $here 'fixtures'
$env:CLEARTV_FAKE_STATE = Join-Path $tmp 'state'
$env:CLEARTV_TIME_SCALE = '0.01'
. (Join-Path $scripts 'common.ps1')

$props = ConvertFrom-GetProp "[ro.a]: [1]`n[ro.b.c]: [x y]`ngarbage"
Check 'ConvertFrom-GetProp' ($props['ro.a'] -eq '1' -and $props['ro.b.c'] -eq 'x y' -and $props.Count -eq 2)
$pl = ConvertFrom-PackageList "package:/system/app/A.apk=com.a`npackage:com.b`n"
Check 'ConvertFrom-PackageList' ($pl.Count -eq 2 -and $pl[0].Path -eq '/system/app/A.apk' -and $pl[1].Package -eq 'com.b')
$bc = ConvertFrom-BriefComponents "priority=0 isDefault=true`ncom.x/.Main`n  com.y/com.y.Act`n"
Check 'ConvertFrom-BriefComponents' ($bc.Count -eq 2 -and $bc[1] -eq 'com.y/com.y.Act')
Check 'ConvertFrom-MemInfoPss (new format)' ((ConvertFrom-MemInfoPss "    TOTAL PSS:    48231   TOTAL RSS: 1") -eq 48231)
Check 'ConvertFrom-MemInfoPss (old format)' ((ConvertFrom-MemInfoPss "  TOTAL   51200   12   3") -eq 51200)
$g = ConvertFrom-GfxInfo "Total frames rendered: 240`nJanky frames: 12 (5.00%)`n90th percentile: 14ms`n95th percentile: 19ms"
Check 'ConvertFrom-GfxInfo' ($g.TotalFrames -eq 240 -and $g.JankyPercent -eq 5 -and $g.P95 -eq 19)
$tv = @(ConvertFrom-TvInputDump (Get-Content (Join-Path $env:CLEARTV_FAKE_FIXTURES 'dumpsys_tv_input.txt') -Raw))
Check 'ConvertFrom-TvInputDump (Salute/Android 13 format): 6 inputs, 3 physical, tuners are not passthrough' ($tv.Count -eq 6 -and @($tv | Where-Object Passthrough).Count -eq 3 -and @($tv | Where-Object Type -eq 'HDMI').Count -eq 2 -and @($tv | Where-Object Type -eq 'TUNER').Count -eq 2 -and ($tv[0].Type -eq 'TUNER') -and ($tv[2].State -eq 1)) "got $($tv.Count): $(($tv | ForEach-Object { "$($_.Type)/$($_.Passthrough)" }) -join ' ')"
$tvA = @(ConvertFrom-TvInputDump "TvInputManagerService`n  TvInputInfo{id=com.vendor.hdmi/.InputService/HW1, type=HDMI, label=HDMI 1}`n  TvInputInfo{id=com.vendor.tuner/.TunerService, type=TUNER}`n")
Check 'ConvertFrom-TvInputDump (AOSP format with type=)' ($tvA.Count -eq 2 -and $tvA[0].Passthrough -and -not $tvA[1].Passthrough -and $tvA[0].Type -eq 'HDMI')
Check 'Test-HdmiCecEnabled (Android 13 "hdmi_cec_enabled (int): 1")' ((Test-HdmiCecEnabled "mIsCecAvailable: false`nCEC settings:`n  hdmi_cec_enabled (int): 1 (default: 0) [modifiable]`n") -eq $true)
Check 'Test-HdmiCecEnabled (Android 13 disabled)' ((Test-HdmiCecEnabled "CEC settings:`n  hdmi_cec_enabled (int): 0 (default: 0) [modifiable]`n") -eq $false)
Check 'Test-HdmiCecEnabled (legacy mHdmiControlEnabled)' ((Test-HdmiCecEnabled (Get-Content (Join-Path $env:CLEARTV_FAKE_FIXTURES 'dumpsys_hdmi_control.txt') -Raw)) -eq $true)
Check 'Test-SameComponent: short "pkg/.ui.HomeActivity" equals the full name' ((Test-SameComponent 'com.cleartv.launcher/.ui.HomeActivity' 'com.cleartv.launcher/com.cleartv.launcher.ui.HomeActivity') -and -not (Test-SameComponent 'ru.sberdevices.starlauncher/.ui.mainscreen.MainActivity' 'com.cleartv.launcher/.ui.HomeActivity') -and -not (Test-SameComponent '' 'a/.B'))
Check 'Test-ConnectivityDumpOnline (Android 13 active default network)' ((Test-ConnectivityDumpOnline "NetworkProviders for:`n  4: WifiNetworkFactory`n`nActive default network: 102`n") -eq $true)
Check 'Test-ConnectivityDumpOnline (Android 13 offline / legacy / unknown)' (((Test-ConnectivityDumpOnline "Active default network: none`n") -eq $false) -and ((Test-ConnectivityDumpOnline "NetworkAgentInfo{ ni{[type: WIFI[], state: CONNECTED/CONNECTED]} }") -eq $true) -and ($null -eq (Test-ConnectivityDumpOnline "")))
Check 'Get-PreferredAppPackages: owner list loaded (VK Video, YouTube)' ((@(Get-PreferredAppPackages) -contains 'com.vk.tv') -and (@(Get-PreferredAppPackages) -contains 'com.google.android.youtube.tv'))
Check 'Select-ApkLink: relative link on the official domain, foreign hosts ignored' (((Select-ApkLink '<a href="https://cdn.evil.example/x.apk">bad</a> <a class="btn" href="/static/apps/rutube-tv.apk?v=3">APK</a>' 'https://rutube.ru/androidtv/' @('rutube.ru')) -eq 'https://rutube.ru/static/apps/rutube-tv.apk?v=3') -and ($null -eq (Select-ApkLink '<a href="https://cdn.evil.example/x.apk">bad</a>' 'https://rutube.ru/androidtv/' @('rutube.ru'))))
Check 'Test-HostAllowed: exact host and subdomains only' ((Test-HostAllowed 'objects.githubusercontent.com' @('github.com', 'githubusercontent.com')) -and -not (Test-HostAllowed 'github.com.evil.example' @('github.com')))
$src = @(Get-AppSources)
Check 'app-sources.json: 11 owner entries, direct entries only from github.com/rutube.ru with url/file/hosts, Twitch via APKMirror (official builds)' ($src.Count -eq 11 -and @($src | Where-Object { $_.kind -eq 'direct' -and $_.url -and $_.file -and $_.hosts }).Count -eq 3 -and @($src | Where-Object { $_.kind -eq 'direct' -and $_.url -notmatch '^https://(github\.com|rutube\.ru)/' }).Count -eq 0 -and (($src | Where-Object id -eq 'twitch').kind -eq 'mirror'))
Check 'app-sources.json: APKMirror entries (owner decision) open apkmirror.com pages only, with file hints and expected packages' (@($src | Where-Object { $_.kind -eq 'mirror' }).Count -eq 7 -and @($src | Where-Object { $_.kind -eq 'mirror' -and (@($_.mirror_pages | Where-Object { $_ -notmatch '^https://www\.apkmirror\.com/' }).Count -gt 0 -or -not $_.file_hint -or -not $_.packages) }).Count -eq 0)
$mirrorOut = & (Join-Path $scripts 'get-apps.ps1') -Ip 192.168.1.50 -Only netflix -Folder (Join-Path $tmp 'apps-mirror') -WaitMinutes 0 -NoBrowser -Yes *>&1 | Out-String
Check 'get-apps mirror: no browser, zero wait -> honest "file did not appear", no crash' ($mirrorOut -match 'файл не появился')
$mirrorDir = Join-Path $tmp 'apps-mirror2'; New-Item -ItemType Directory -Path $mirrorDir -Force | Out-Null
Set-Content (Join-Path $mirrorDir 'com.netflix.mediaclient_9.apk') 'placeholder'
$mirrorOut2 = & (Join-Path $scripts 'get-apps.ps1') -Ip 192.168.1.50 -Only netflix -Folder $mirrorDir -WaitMinutes 0 -NoBrowser -Yes *>&1 | Out-String
Check 'get-apps mirror: a matching file already in apps is reported, not re-requested' ($mirrorOut2 -match 'Уже в папке')
$plan = & (Join-Path $scripts 'get-apps.ps1') -ListOnly -Folder (Join-Path $tmp 'apps-plan') *>&1 | Out-String
Check 'get-apps -ListOnly: plans SmartTube/Happ/RUTUBE and APKMirror pages for the rest, no network' (($plan -match 'smarttube_stable\.apk') -and ($plan -match 'Happ\.apk') -and ($plan -match 'rutube\.ru/androidtv/latest') -and ($plan -match 'apkmirror\.com') -and ($plan -match 'armeabi-v7a'))
$ev = ConvertFrom-LogcatEvents "I ClearTV : EVT focus row=apps index=0 pkg=a`nI ClearTV : MARK abc`nI ClearTV : EVT launch pkg=com.x ok=true`n" 'MARK abc'
Check 'ConvertFrom-LogcatEvents after marker' ($ev.Count -eq 1 -and $ev[0].Name -eq 'launch' -and $ev[0].Fields['ok'] -eq 'true')
$pk = ConvertFrom-DumpsysPackages (Get-Content (Join-Path $env:CLEARTV_FAKE_FIXTURES 'dumpsys_package_packages.txt') -Raw)
Check 'ConvertFrom-DumpsysPackages count' ($pk.Count -eq 21) "got $($pk.Count)"
Check 'ConvertFrom-DumpsysPackages overlayTarget' ((($pk | Where-Object Package -eq 'ru.sberdevices.rro.framework').OverlayTarget -eq 'android') -and (($pk | Where-Object Package -eq 'com.android.systemui').OverlayTarget -eq ''))
$upd = $pk | Where-Object Package -eq 'com.example.updater'
Check 'ConvertFrom-DumpsysPackages permissions' ($upd.GrantedPermissions -contains 'android.permission.INSTALL_PACKAGES' -and $upd.PrivateFlags -match 'PRIVILEGED')
$sysui = $pk | Where-Object Package -eq 'com.android.systemui'
Check 'ConvertFrom-DumpsysPackages sharedUser' ($sysui.SharedUser -eq 'android.uid.systemui')

$ctx = @{ LeanbackPkgs = @('com.example.mediaapp', 'com.example.usergame', 'com.stock.launcher'); LauncherPkgs = @('com.example.usergame', 'com.android.tv.settings'); HomePkgs = @('com.stock.launcher'); TvInputPkgs = @('com.vendor.hdmi', 'com.vendor.tuner'); ImePkgs = @('com.android.inputmethod.latin'); VoicePkgs = @('com.example.voice'); BootPkgs = @('com.example.mysteryservice', 'com.example.updater'); PassthroughPkgs = @('com.android.tv'); CurrentHome = 'com.stock.launcher'; ThirdPartyPkgs = @('com.example.usergame'); ObservedOnScreen = @() }
function Cat($name) { (Get-PackageCategory -Info ($pk | Where-Object Package -eq $name) -Context $ctx).Category }
Check 'category: systemui CRITICAL' ((Cat 'com.android.systemui') -eq 'CRITICAL')
Check 'category: stock launcher CRITICAL' ((Cat 'com.stock.launcher') -eq 'CRITICAL')
Check 'category: HDMI input provider CRITICAL' ((Cat 'com.vendor.hdmi') -eq 'CRITICAL')
Check 'category: updater (INSTALL_PACKAGES) CRITICAL' ((Cat 'com.example.updater') -eq 'CRITICAL')
Check 'category: voice service CRITICAL' ((Cat 'com.example.voice') -eq 'CRITICAL')
Check 'category: IME CRITICAL' ((Cat 'com.android.inputmethod.latin') -eq 'CRITICAL')
Check 'category: SoC vendor CRITICAL' ((Cat 'com.droidlogic.tvinput') -eq 'CRITICAL')
Check 'category: RRO overlay (no code, overlayTarget=android) CRITICAL' ((Cat 'ru.sberdevices.rro.framework') -eq 'CRITICAL')
Check 'category: system media app OPTIONAL' ((Cat 'com.example.mediaapp') -eq 'OPTIONAL')
Check 'category: user game OPTIONAL' ((Cat 'com.example.usergame') -eq 'OPTIONAL')
Check 'category: mystery service UNKNOWN' ((Cat 'com.example.mysteryservice') -eq 'UNKNOWN')
$ctx2 = $ctx.Clone(); $ctx2.ObservedOnScreen = @('com.example.mysteryservice')
Check 'category: observed on screen -> PROMOTIONAL-CANDIDATE' ((Get-PackageCategory -Info ($pk | Where-Object Package -eq 'com.example.mysteryservice') -Context $ctx2).Category -eq 'PROMOTIONAL-CANDIDATE')
$opt = Get-PackageCategory -Info ($pk | Where-Object Package -eq 'com.example.usergame') -Context $ctx
Check 'OPTIONAL third-party has reversible commands' ($opt.DisableCommand -match 'pm uninstall -k --user 0' -and $opt.RestoreCommand -match 'install-existing')
$ctxS = $ctx.Clone(); $ctxS.HomePkgs = @('com.stock.launcher', 'ru.sberdevices.starlauncher'); $ctxS.LeanbackPkgs = $ctx.LeanbackPkgs + @('ru.sberdevices.startube', 'ru.sberdevices.smarthome.promo')
function CatS($name) { (Get-PackageCategory -Info ($pk | Where-Object Package -eq $name) -Context $ctxS) }
Check 'KB: Sber launcher stays CRITICAL despite launcher activity' ((CatS 'ru.sberdevices.starlauncher').Category -eq 'CRITICAL')
Check 'KB: smarthome.promo -> PROMOTIONAL with pm disable-user' ((CatS 'ru.sberdevices.smarthome.promo').Category -eq 'PROMOTIONAL' -and (CatS 'ru.sberdevices.smarthome.promo').DisableCommand -eq 'pm disable-user --user 0 ru.sberdevices.smarthome.promo')
Check 'KB: crashreporter -> PROMOTIONAL' ((CatS 'ru.sberdevices.crashreporter').Category -eq 'PROMOTIONAL')
Check 'KB: startube -> OPTIONAL (ask) with breaks text' ((CatS 'ru.sberdevices.startube').Category -eq 'OPTIONAL' -and (CatS 'ru.sberdevices.startube').Breaks -ne '')
Check 'KB: assistant and services CRITICAL' ((CatS 'ru.sberdevices.assistant').Category -eq 'CRITICAL' -and (CatS 'ru.sberdevices.services').Category -eq 'CRITICAL')

Write-Host "== 3. diagnose.ps1 -SkipDevice"
& (Join-Path $scripts 'diagnose.ps1') -SkipDevice *> (Join-Path $tmp 'diag-skip.log')
Check 'environment-report.json written' (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'environment-report.json'))

Write-Host "== 4. diagnose.ps1 against the fake TV"
& (Join-Path $scripts 'diagnose.ps1') -Ip 192.168.1.50 *> (Join-Path $tmp 'diag.log')
$dr = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'device-report.json') -Raw | ConvertFrom-Json
Check 'device-report: model/api' ($dr.Device.Model -eq 'SBER_TV_FAKE' -and $dr.Android.Api -eq '30')
Check 'device-report: memory and display' ($dr.Memory.TotalMb -eq 1500 -and $dr.Display.PhysicalSize -eq '1920x1080' -and $dr.Display.DensityDpi -eq '320')
Check 'device-report: home + set-home support' ($dr.Home.Current -eq 'com.stock.launcher/.HomeActivity' -and $dr.Home.SetHomeActivitySupported -eq $true)
Check 'device-report: inputs' ($dr.Tv.PassthroughInputs -eq 3 -and $dr.Tv.HdmiCecEnabled -eq $true)
Check 'device-report: packages counted' ($dr.Packages.Total -eq 21 -and $dr.Packages.ByCategory.CRITICAL -ge 12 -and $dr.Packages.ByCategory.PROMOTIONAL -eq 2)
$inv = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'inventory.json') -Raw | ConvertFrom-Json
Check 'device-report: RRO overlays are CRITICAL, not UNKNOWN' ((($inv | Where-Object Package -eq 'ru.sberdevices.rro.framework').Category) -eq 'CRITICAL')
Check 'inventory.json: launcher is CRITICAL' ((($inv | Where-Object Package -eq 'com.stock.launcher').Category) -eq 'CRITICAL')
Check 'inventory.md written' (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'inventory.md'))
Check 'device-report.md written' (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'device-report.md'))
Check 'backup snapshot written' (@(Get-ChildItem (Join-Path $env:CLEARTV_REPORTS_DIR 'backup') -Directory).Count -eq 1)

Write-Host "== 5. install.ps1 (journal) and set-home"
$apk = Join-Path $tmp 'ClearTV-test.apk'; Set-Content $apk 'fake'
& (Join-Path $scripts 'install.ps1') -Ip 192.168.1.50 -Apk $apk -NoLaunch *> (Join-Path $tmp 'install.log')
$j = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json
Check 'journal: install entry with restore command' (@($j).Count -eq 1 -and $j[0].Action -eq 'install-apk' -and $j[0].RestoreCommand -eq 'pm uninstall com.cleartv.launcher')
& (Join-Path $scripts 'install.ps1') -Ip 192.168.1.50 -Apk $apk -NoLaunch -SetHome -Yes *> (Join-Path $tmp 'install2.log')
$j = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
$homeState = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw
Check 'set-home applied on device' ($homeState.Trim() -eq 'com.cleartv.launcher/com.cleartv.launcher.ui.HomeActivity')
$sh = $j | Where-Object Action -eq 'set-home'
Check 'journal: set-home entry remembers previous launcher and turns the keeper off first' ($sh.Previous -eq 'com.stock.launcher/.HomeActivity' -and $sh.RestoreCommand -match 'cleartv.keep_home false; cmd package set-home-activity com.stock.launcher/.HomeActivity$')
Check 'journal: update entry has no restore command' ((@($j | Where-Object Action -eq 'update-apk').Count -eq 1))

Write-Host "== 5b. install.ps1 -SetHome on a TV that is already switched but has no rollback entry (first real run)"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-repair'
New-Item -ItemType Directory -Path (Join-Path $env:CLEARTV_REPORTS_DIR 'backup/20260101-000000') -Force | Out-Null
Set-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'backup/20260101-000000/home-activity.txt') 'com.stock.launcher/.HomeActivity'
Set-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') 'com.cleartv.launcher/com.cleartv.launcher.ui.HomeActivity'
Remove-Item (Join-Path $env:CLEARTV_FAKE_STATE 'logcat.txt') -ErrorAction SilentlyContinue
& (Join-Path $scripts 'install.ps1') -Ip 192.168.1.50 -Apk $apk -NoLaunch -SetHome -Yes *> (Join-Path $tmp 'install-repair.log')
$jr = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
$shr = @($jr | Where-Object Action -eq 'set-home')
Check 'repair: set-home entry recreated from the snapshot with a restore command' ($shr.Count -eq 1 -and $shr[0].Previous -eq 'com.stock.launcher/.HomeActivity' -and $shr[0].RestoreCommand -match 'set-home-activity com.stock.launcher/.HomeActivity$') "got $($shr.Count): $($shr | ConvertTo-Json -Compress)"
$calls = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'calls.log') -Raw
Check 'repair: keeper enabled (cleartv.keep_home true sent)' ($calls -match 'cleartv.keep_home true')
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes *> (Join-Path $tmp 'restore-repair.log')
Check 'repair: restore brings the stock launcher back' (((Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw).Trim()) -eq 'com.stock.launcher/.HomeActivity')
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports'

Write-Host "== 5d. install.ps1 -SetHome while the firmware shows its chooser: rollback points at a real launcher"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-chooser'
New-Item -ItemType Directory -Path (Join-Path $env:CLEARTV_REPORTS_DIR 'backup/20260101-000000') -Force | Out-Null
Set-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'backup/20260101-000000/home-activity.txt') 'com.stock.launcher/.HomeActivity'
Set-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') 'android/com.android.internal.app.ResolverActivity'
& (Join-Path $scripts 'install.ps1') -Ip 192.168.1.50 -Apk $apk -NoLaunch -SetHome -Yes *> (Join-Path $tmp 'install-chooser.log')
$jc2 = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json | Where-Object Action -eq 'set-home')
Check 'chooser: set-home journal entry remembers the stock launcher, not ResolverActivity' ($jc2.Count -eq 1 -and $jc2[0].Previous -eq 'com.stock.launcher/.HomeActivity' -and $jc2[0].RestoreCommand -match 'set-home-activity com.stock.launcher/.HomeActivity$') "got $($jc2 | ConvertTo-Json -Compress)"
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes *> (Join-Path $tmp 'restore-chooser.log')
Check 'chooser: restore sets the stock launcher' (((Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw).Trim()) -eq 'com.stock.launcher/.HomeActivity')
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports'

Write-Host "== 5c. install-apps.ps1 (owner's APK folder)"
$appsDir = Join-Path $tmp 'apps'; New-Item -ItemType Directory -Path $appsDir -Force | Out-Null
Set-Content (Join-Path $appsDir 'SomeApp.apk') 'fake'
& (Join-Path $scripts 'install-apps.ps1') -Ip 192.168.1.50 -Folder $appsDir -Yes *> (Join-Path $tmp 'install-apps.log')
$ja = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
Check 'install-apps: APK installed and journaled without an automatic rollback' (@($ja | Where-Object { $_.Action -eq 'install-app' -and -not $_.RestoreCommand }).Count -eq 1)
$emptyDir = Join-Path $tmp 'apps-empty'; New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
$outApps = & (Join-Path $scripts 'install-apps.ps1') -Ip 192.168.1.50 -Folder $emptyDir -Yes *>&1 | Out-String
Check 'install-apps: empty folder is a no-op' ($outApps -match 'нет APK')
$bundleDir = Join-Path $tmp 'apps-bundle'; New-Item -ItemType Directory -Path (Join-Path $bundleDir 'src') -Force | Out-Null
foreach ($n in @('base.apk', 'split_config.armeabi_v7a.apk', 'split_config.arm64_v8a.apk', 'split_config.xhdpi.apk', 'split_config.xxhdpi.apk', 'split_config.ru.apk', 'split_config.de.apk')) { Set-Content (Join-Path (Join-Path $bundleDir 'src') $n) 'x' }
Compress-Archive -Path (Join-Path (Join-Path $bundleDir 'src') '*') -DestinationPath (Join-Path $bundleDir 'bundle.zip') -Force
Move-Item (Join-Path $bundleDir 'bundle.zip') (Join-Path $bundleDir 'Netflix.apkm') -Force
Remove-Item (Join-Path $bundleDir 'src') -Recurse -Force
& (Join-Path $scripts 'install-apps.ps1') -Ip 192.168.1.50 -Folder $bundleDir -Yes *> (Join-Path $tmp 'install-bundle.log')
$bundleCall = @(Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'calls.log') | Where-Object { $_ -match 'install-multiple' })[-1]
Check 'install-apps: .apkm bundle installed with install-multiple using only base + armeabi_v7a + xhdpi + ru splits' ($bundleCall -and $bundleCall -match 'base\.apk' -and $bundleCall -match 'armeabi_v7a' -and $bundleCall -match 'xhdpi' -and $bundleCall -match 'config\.ru' -and $bundleCall -notmatch 'arm64_v8a' -and $bundleCall -notmatch 'xxhdpi' -and $bundleCall -notmatch 'config\.de') "got: $bundleCall"

Write-Host "== 6. verify.ps1 smoke run (fake device, time-scaled)"
& (Join-Path $scripts 'verify.ps1') -Ip 192.168.1.50 *> (Join-Path $tmp 'verify.log')
$vr = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'verify-report.json') -Raw | ConvertFrom-Json
Check 'verify-report.json written with results' (@($vr.Results).Count -ge 12)
Check 'verify: installed/cold_start/ram/gfx PASS on fake' ((@($vr.Results | Where-Object { $_.Test -in @('installed', 'cold_start', 'ram_usage', 'frame_stats') -and $_.Status -eq 'PASS' }).Count) -eq 4)
Check 'verify: dpad FAIL on fake (no focus events, honest)' ((@($vr.Results | Where-Object { $_.Test -eq 'dpad_navigation' }).Status) -eq 'FAIL')
$sp = @($vr.Results | Where-Object { $_.Test -eq 'settings_panel' })[0]
Check 'verify: settings_panel WARN on fake (remote path silent, intent hook opens, BACK closes)' ($sp.Status -eq 'WARN' -and $sp.Details -match 'cleartv.open_settings') "got $($sp.Status): $($sp.Details)"
Check 'verify-report.md written' (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'verify-report.md'))

Write-Host "== 7. restore.ps1"
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes *> (Join-Path $tmp 'restore.log')
$homeState = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw
Check 'restore: stock launcher is HOME again' ($homeState.Trim() -eq 'com.stock.launcher/.HomeActivity')
$j = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
Check 'restore: set-home marked restored, install kept' ((($j | Where-Object Action -eq 'set-home').Restored -eq $true) -and (($j | Where-Object Action -eq 'install-apk').Restored -eq $false))
Check 'restore: ClearTV still installed without -Uninstall' (Test-Path (Join-Path $env:CLEARTV_FAKE_STATE 'installed'))
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes -Uninstall *> (Join-Path $tmp 'restore2.log')
Check 'restore -Uninstall: package removed' (-not (Test-Path (Join-Path $env:CLEARTV_FAKE_STATE 'installed')))
$j = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
Check 'restore -Uninstall: install entry marked restored' ((($j | Where-Object Action -eq 'install-apk').Restored) -eq $true)

Write-Host "== 8. restore.ps1 with no journal"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-empty'
$out = & (Join-Path $scripts 'restore.ps1') -Yes *>&1 | Out-String
Check 'restore without journal: says nothing to restore' ($out -match 'восстанавливать нечего')

Write-Host "== 9a. clean.ps1 dry run and execution against the fake TV"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-clean'
Remove-Item (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt') -ErrorAction SilentlyContinue
& (Join-Path $scripts 'clean.ps1') -Ip 192.168.1.50 -DryRun *> (Join-Path $tmp 'clean-dry.log')
$planMd = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'clean-plan.md') -Raw
Check 'clean dry-run: plan lists promo + crashreporter only' (($planMd -match 'ru.sberdevices.smarthome.promo') -and ($planMd -match 'ru.sberdevices.crashreporter') -and ($planMd -notmatch 'ru.sberdevices.startube') -and ($planMd -notmatch 'ru.sberdevices.starlauncher'))
Check 'clean dry-run: nothing disabled' (-not (Test-Path (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt')))
& (Join-Path $scripts 'clean.ps1') -Ip 192.168.1.50 -Yes -BlockOverlays -Screensaver -HomeGuard -LowerStorageThreshold *> (Join-Path $tmp 'clean.log')
$calls = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'calls.log') -Raw
Check 'clean: screensaver is set before packages are disabled' ($calls.IndexOf('settings put secure screensaver_components') -lt $calls.IndexOf('pm disable-user --user 0 ru.sberdevices.smarthome.promo'))
$global = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'settings_global.txt') -Raw
Check 'clean: storage threshold lowered to 1%' ($global -match 'sys_storage_threshold_percentage=1')
$disabled = @(Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt') -ErrorAction SilentlyContinue)
Check 'clean: promo and crashreporter disabled, nothing else' ($disabled.Count -eq 2 -and ($disabled -contains 'ru.sberdevices.smarthome.promo') -and ($disabled -contains 'ru.sberdevices.crashreporter'))
$secure = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'settings_secure.txt') -Raw
Check 'clean: ClearTV screensaver and home guard set' (($secure -match 'screensaver_components=com.cleartv.launcher/com.cleartv.launcher.dream.ClearDream') -and ($secure -match 'enabled_accessibility_services=.*HomeGuardService') -and ($secure -match 'accessibility_enabled=1'))
$ops = Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'appops.txt') -Raw
Check 'clean: overlay denied for ru.sberdevices.services' ($ops -match 'ru.sberdevices.services=deny')
$jc = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
Check 'clean: journal has 2 disable + overlay + screensaver + guard entries with restore commands' ((@($jc | Where-Object Action -eq 'disable-package').Count -eq 2) -and (@($jc | Where-Object { $_.Action -in @('appops-overlay','screensaver','home-guard') -and $_.RestoreCommand }).Count -eq 3))
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes *> (Join-Path $tmp 'clean-restore.log')
$disabled = @(Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt') -ErrorAction SilentlyContinue | Where-Object { $_ })
# [string] keeps an empty file from turning into an empty array, which -notmatch would filter instead of test
$secure = [string](Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'settings_secure.txt') -Raw -ErrorAction SilentlyContinue)
$ops = [string](Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'appops.txt') -Raw -ErrorAction SilentlyContinue)
$global = [string](Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'settings_global.txt') -Raw -ErrorAction SilentlyContinue)
Check 'restore after clean: packages enabled, settings and appops back' (($disabled.Count -eq 0) -and ($secure -notmatch 'screensaver_components=') -and ($secure -notmatch 'HomeGuardService') -and ($ops -match 'ru.sberdevices.services=allow') -and ($global -notmatch 'sys_storage_threshold_percentage='))
$jc = @(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json)
Check 'restore after clean: all entries marked restored' (@($jc | Where-Object { -not $_.Restored -and $_.RestoreCommand }).Count -eq 0)

Write-Host "== 9c. clean.ps1 -RemoveOtherApps: only user-installed extras, never Sber platform apps; restore brings them back"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-remove'
Remove-Item (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt'), (Join-Path $env:CLEARTV_FAKE_STATE 'uninstalled.txt') -ErrorAction SilentlyContinue
& (Join-Path $scripts 'clean.ps1') -Ip 192.168.1.50 -DryRun -RemoveOtherApps *> (Join-Path $tmp 'clean-remove-dry.log')
$planMd = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'clean-plan.md') -Raw
Check 'remove dry-run: user game planned for uninstall, Sber startube/music and system apps not' (($planMd -match 'pm uninstall -k --user 0 com.example.usergame') -and ($planMd -notmatch 'ru.sberdevices.startube') -and ($planMd -notmatch 'com.example.mediaapp'))
& (Join-Path $scripts 'clean.ps1') -Ip 192.168.1.50 -Yes -RemoveOtherApps *> (Join-Path $tmp 'clean-remove.log')
$un = @(Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'uninstalled.txt') -ErrorAction SilentlyContinue)
Check 'remove: user game uninstalled for user 0, journaled with install-existing rollback' (($un -contains 'com.example.usergame') -and (@(Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'operations-journal.json') -Raw | ConvertFrom-Json | Where-Object { $_.Action -eq 'uninstall-user-app' -and $_.RestoreCommand -match 'install-existing com.example.usergame' }).Count -eq 1))
& (Join-Path $scripts 'restore.ps1') -Ip 192.168.1.50 -Yes *> (Join-Path $tmp 'clean-remove-restore.log')
$un = @(Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'uninstalled.txt') -ErrorAction SilentlyContinue | Where-Object { $_ })
Check 'remove: restore reinstalls the user app' ($un.Count -eq 0)

Write-Host "== 9. run-all.ps1 (one-click flow) against the fake TV"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-runall'
Remove-Item (Join-Path $env:CLEARTV_FAKE_STATE 'installed') -ErrorAction SilentlyContinue
Remove-Item (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt') -ErrorAction SilentlyContinue
& (Join-Path $scripts 'run-all.ps1') -Ip 192.168.1.50 -SafeOnly -NoDownload *> (Join-Path $tmp 'run-all.log')
Check 'run-all: install-apps step skipped with a reason when apps folder is empty' ((Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'run-all-summary.txt') -Raw) -match 'нет APK')
$zips = @(Get-ChildItem $tmp -Filter 'ClearTV-reports-*.zip')
Check 'run-all: reports zip produced' ($zips.Count -eq 1)
Check 'run-all: device, inventory and verify reports inside' ((Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'device-report.md')) -and (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'inventory.md')) -and (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'verify-report.md')))
Check 'run-all (safe): ClearTV installed, HOME untouched, nothing disabled' ((Test-Path (Join-Path $env:CLEARTV_FAKE_STATE 'installed')) -and ((Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw).Trim() -eq 'com.stock.launcher/.HomeActivity') -and -not (Test-Path (Join-Path $env:CLEARTV_FAKE_STATE 'disabled.txt')))

Write-Host "== 9b. run-all.ps1 -Full: gate on verify, then set-home + clean"
$env:CLEARTV_REPORTS_DIR = Join-Path $tmp 'reports-full'
& (Join-Path $scripts 'run-all.ps1') -Ip 192.168.1.50 -Full -NoDownload *> (Join-Path $tmp 'run-all-full.log')
$fullLog = Get-Content (Join-Path $tmp 'run-all-full.log') -Raw
Check 'run-all -Full: refused because dpad test fails on the fake TV (gate works)' (($fullLog -match 'не пройдена') -and ((Get-Content (Join-Path $env:CLEARTV_FAKE_STATE 'home.txt') -Raw).Trim() -eq 'com.stock.launcher/.HomeActivity'))

Write-Host ""
Write-Host "Passed: $passed  Failed: $failures   (logs: $tmp)"
if ($failures -gt 0) { exit 1 } else { exit 0 }
