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
$tv = ConvertFrom-TvInputDump (Get-Content (Join-Path $env:CLEARTV_FAKE_FIXTURES 'dumpsys_tv_input.txt') -Raw)
Check 'ConvertFrom-TvInputDump' ($tv.Count -eq 3 -and @($tv | Where-Object Passthrough).Count -eq 2 -and $tv[0].Type -eq 'HDMI')
$ev = ConvertFrom-LogcatEvents "I ClearTV : EVT focus row=apps index=0 pkg=a`nI ClearTV : MARK abc`nI ClearTV : EVT launch pkg=com.x ok=true`n" 'MARK abc'
Check 'ConvertFrom-LogcatEvents after marker' ($ev.Count -eq 1 -and $ev[0].Name -eq 'launch' -and $ev[0].Fields['ok'] -eq 'true')
$pk = ConvertFrom-DumpsysPackages (Get-Content (Join-Path $env:CLEARTV_FAKE_FIXTURES 'dumpsys_package_packages.txt') -Raw)
Check 'ConvertFrom-DumpsysPackages count' ($pk.Count -eq 13) "got $($pk.Count)"
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
Check 'category: system media app OPTIONAL' ((Cat 'com.example.mediaapp') -eq 'OPTIONAL')
Check 'category: user game OPTIONAL' ((Cat 'com.example.usergame') -eq 'OPTIONAL')
Check 'category: mystery service UNKNOWN' ((Cat 'com.example.mysteryservice') -eq 'UNKNOWN')
$ctx2 = $ctx.Clone(); $ctx2.ObservedOnScreen = @('com.example.mysteryservice')
Check 'category: observed on screen -> PROMOTIONAL-CANDIDATE' ((Get-PackageCategory -Info ($pk | Where-Object Package -eq 'com.example.mysteryservice') -Context $ctx2).Category -eq 'PROMOTIONAL-CANDIDATE')
$opt = Get-PackageCategory -Info ($pk | Where-Object Package -eq 'com.example.usergame') -Context $ctx
Check 'OPTIONAL third-party has reversible commands' ($opt.DisableCommand -match 'pm uninstall -k --user 0' -and $opt.RestoreCommand -match 'install-existing')

Write-Host "== 3. diagnose.ps1 -SkipDevice"
& (Join-Path $scripts 'diagnose.ps1') -SkipDevice *> (Join-Path $tmp 'diag-skip.log')
Check 'environment-report.json written' (Test-Path (Join-Path $env:CLEARTV_REPORTS_DIR 'environment-report.json'))

Write-Host "== 4. diagnose.ps1 against the fake TV"
& (Join-Path $scripts 'diagnose.ps1') -Ip 192.168.1.50 *> (Join-Path $tmp 'diag.log')
$dr = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'device-report.json') -Raw | ConvertFrom-Json
Check 'device-report: model/api' ($dr.Device.Model -eq 'SBER_TV_FAKE' -and $dr.Android.Api -eq '30')
Check 'device-report: memory and display' ($dr.Memory.TotalMb -eq 1500 -and $dr.Display.PhysicalSize -eq '1920x1080' -and $dr.Display.DensityDpi -eq '320')
Check 'device-report: home + set-home support' ($dr.Home.Current -eq 'com.stock.launcher/.HomeActivity' -and $dr.Home.SetHomeActivitySupported -eq $true)
Check 'device-report: inputs' ($dr.Tv.PassthroughInputs -eq 2 -and $dr.Tv.HdmiCecEnabled -eq $true)
Check 'device-report: packages counted' ($dr.Packages.Total -eq 13 -and $dr.Packages.ByCategory.CRITICAL -ge 8)
$inv = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'inventory.json') -Raw | ConvertFrom-Json
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
Check 'journal: set-home entry remembers previous launcher' ($sh.Previous -eq 'com.stock.launcher/.HomeActivity' -and $sh.RestoreCommand -eq 'cmd package set-home-activity com.stock.launcher/.HomeActivity')
Check 'journal: update entry has no restore command' ((@($j | Where-Object Action -eq 'update-apk').Count -eq 1))

Write-Host "== 6. verify.ps1 smoke run (fake device, time-scaled)"
& (Join-Path $scripts 'verify.ps1') -Ip 192.168.1.50 *> (Join-Path $tmp 'verify.log')
$vr = Get-Content (Join-Path $env:CLEARTV_REPORTS_DIR 'verify-report.json') -Raw | ConvertFrom-Json
Check 'verify-report.json written with results' (@($vr.Results).Count -ge 12)
Check 'verify: installed/cold_start/ram/gfx PASS on fake' ((@($vr.Results | Where-Object { $_.Test -in @('installed', 'cold_start', 'ram_usage', 'frame_stats') -and $_.Status -eq 'PASS' }).Count) -eq 4)
Check 'verify: dpad FAIL on fake (no focus events, honest)' ((@($vr.Results | Where-Object { $_.Test -eq 'dpad_navigation' }).Status) -eq 'FAIL')
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

Write-Host ""
Write-Host "Passed: $passed  Failed: $failures   (logs: $tmp)"
if ($failures -gt 0) { exit 1 } else { exit 0 }
