<#
.SYNOPSIS
  ClearTV — сборка APK на Windows через Gradle и Android Gradle Plugin.
.DESCRIPTION
  Проверяет JDK 17+, находит Android SDK (ANDROID_HOME / local.properties / %LOCALAPPDATA%\Android\Sdk),
  при -InstallSdk скачивает командные инструменты SDK с официального сайта Google и ставит
  platforms;android-34 + build-tools;34.0.0, затем запускает gradlew.bat assembleDebug|assembleRelease.
  Готовый APK копируется в dist\ вместе с SHA-256, отчёт — reports\build-report.md.
.PARAMETER Release
  Собрать release (R8, сжатие ресурсов). Без keystore.properties подписывается отладочным ключом.
.PARAMETER InstallSdk
  Разрешить загрузку Android SDK command-line tools с https://dl.google.com (только официальный источник).
.PARAMETER SdkDir
  Куда ставить/где искать SDK (по умолчанию %LOCALAPPDATA%\Android\Sdk).
.PARAMETER Offline
  Передать Gradle флаг --offline.
#>
[CmdletBinding()]
param(
    [switch]$Release,
    [switch]$InstallSdk,
    [string]$SdkDir,
    [switch]$Offline
)
. (Join-Path $PSScriptRoot 'common.ps1')

$t0 = Get-Date
Write-Step "Проверка JDK"
$java = Get-JavaVersion
if (-not $java.Found -or $java.Major -lt 17) {
    throw "Нужна JDK 17 или новее. Установите, например: winget install Microsoft.OpenJDK.17  (или Eclipse Temurin: https://adoptium.net), затем откройте новое окно PowerShell."
}
Write-Ok "Java $($java.Major): $($java.Path)"
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $java.Path)
    Write-Info "JAVA_HOME не задан — используется $env:JAVA_HOME"
}

Write-Step "Android SDK"
$sdk = Find-AndroidSdk
if (-not $sdk) {
    if (-not $SdkDir) { $SdkDir = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
    if (-not $InstallSdk) {
        throw "Android SDK не найден. Запустите с -InstallSdk, чтобы скачать командные инструменты SDK с dl.google.com в $SdkDir, или установите Android Studio и повторите."
    }
    $sdk = $SdkDir
    New-Dir $sdk | Out-Null
    $zip = Join-Path $sdk 'cmdline-tools.zip'
    $url = 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip'
    Write-Info "Загрузка $url"
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    $tmp = Join-Path $sdk 'cmdline-tools-tmp'
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    $latest = Join-Path (Join-Path $sdk 'cmdline-tools') 'latest'
    New-Dir (Split-Path -Parent $latest) | Out-Null
    if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
    Move-Item (Join-Path $tmp 'cmdline-tools') $latest
    Remove-Item $tmp -Recurse -Force; Remove-Item $zip -Force
    Write-Ok "cmdline-tools установлены в $latest"
}
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
Write-Ok "SDK: $sdk"

$sdkmanager = Join-Path (Join-Path (Join-Path (Join-Path $sdk 'cmdline-tools') 'latest') 'bin') 'sdkmanager.bat'
$needPlatform = -not (Test-Path (Join-Path (Join-Path $sdk 'platforms') 'android-34'))
$needBuildTools = -not (Test-Path (Join-Path (Join-Path $sdk 'build-tools') '34.0.0'))
$needPlatformTools = -not (Test-Path (Join-Path (Join-Path $sdk 'platform-tools') 'adb.exe'))
if ($needPlatform -or $needBuildTools -or $needPlatformTools) {
    if (-not (Test-Path $sdkmanager)) {
        throw "В SDK нет platforms\android-34 или build-tools\34.0.0, а sdkmanager не найден ($sdkmanager). Установите их через Android Studio (SDK Manager) или запустите с -InstallSdk."
    }
    Write-Step "Установка компонентов SDK (лицензии Google принимаются автоматически)"
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $yes = ("y`n" * 30)
    $yes | & $sdkmanager --sdk_root="$sdk" --licenses | Out-Null
    $yes | & $sdkmanager --sdk_root="$sdk" "platform-tools" "platforms;android-34" "build-tools;34.0.0" | ForEach-Object { if ($_ -notmatch '^\s*$|\[=+') { Write-Info "$_" } }
    $ErrorActionPreference = $prev
    if ($LASTEXITCODE -ne 0) { throw "sdkmanager завершился с кодом $LASTEXITCODE" }
    Write-Ok "Компоненты SDK установлены"
}

$lp = Join-Path $ProjectRoot 'local.properties'
$escaped = $sdk -replace '\\', '\\\\' -replace ':', '\:'
Write-Utf8File $lp "sdk.dir=$escaped`n"
Write-Info "local.properties: sdk.dir=$sdk"

Write-Step "Gradle: $(if ($Release) { 'assembleRelease' } else { 'assembleDebug' })"
$gradlew = Join-Path $ProjectRoot 'gradlew.bat'
if (-not (Test-Path $gradlew)) { throw "gradlew.bat не найден в $ProjectRoot" }
$task = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
$gradleArgs = @($task, ':core:test', '--console=plain', '--no-daemon')
if ($Offline) { $gradleArgs += '--offline' }
Push-Location $ProjectRoot
try {
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & $gradlew @gradleArgs 2>&1 | ForEach-Object { "$_" } | Tee-Object -Variable gradleOut | ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
} finally { Pop-Location }
if ($code -ne 0) { throw "Сборка не удалась (gradlew exit $code). Полный вывод выше; проверьте JDK, SDK и доступ к maven.google.com / repo1.maven.org." }

$variant = if ($Release) { 'release' } else { 'debug' }
$apk = Get-ChildItem (Join-Path $ProjectRoot "app\build\outputs\apk\$variant") -Filter '*.apk' -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) { throw "APK не найден в app\build\outputs\apk\$variant" }
$versionProps = @{}
foreach ($line in Get-Content (Join-Path $ProjectRoot 'version.properties')) { if ($line -match '^(\w+)=(.+)$') { $versionProps[$Matches[1]] = $Matches[2].Trim() } }
New-Dir $DistDir | Out-Null
$target = Join-Path $DistDir ("ClearTV-{0}-{1}.apk" -f $versionProps['versionName'], $variant)
Copy-Item $apk.FullName $target -Force
$hash = (Get-FileHash $target -Algorithm SHA256).Hash.ToLower()
Write-Utf8File "$target.sha256" "$hash  $(Split-Path -Leaf $target)`n"

$report = @"
# Отчёт о сборке ClearTV

- Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), длительность $([int]((Get-Date) - $t0).TotalSeconds) с
- Вариант: $variant, версия $($versionProps['versionName']) ($($versionProps['versionCode']))
- JDK: $($java.Major) ($($java.Path))
- Android SDK: $sdk
- Gradle: $task + :core:test (JUnit)
- APK: ``$target`` ($([math]::Round($apk.Length / 1024)) КБ)
- SHA-256: ``$hash``

Следующий шаг: ``scripts\install.ps1 -Ip <адрес телевизора>``
"@
Write-Utf8File (Join-Path $ReportsDir 'build-report.md') $report
Write-Step "Готово"
Write-Ok "APK: $target"
Write-Ok "SHA-256: $hash"
Write-Ok "Отчёт: reports\build-report.md"
