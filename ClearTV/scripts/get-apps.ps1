<#
.SYNOPSIS
  ClearTV — скачивание установщиков приложений владельца из официальных источников в папку apps\.
.DESCRIPTION
  Список и источники — scripts\data\app-sources.json: только GitHub Releases самих разработчиков и их сайты,
  никаких APK-агрегаторов. Для каждого приложения: уже стоит на телевизоре — пропуск; файл уже в apps\ — пропуск;
  иначе скачивание с проверкой, что итоговый адрес (после переадресаций) принадлежит официальному домену, что файл —
  APK (zip с AndroidManifest.xml), и запись SHA-256 в reports\apps-download.md. Для приложений без официального
  способа установки (Netflix, HBO Max, Apple TV, Spotify, Chrome) печатается честное пояснение.
  Установкой занимается install-apps.ps1 (run-all вызывает его следующим шагом).
.PARAMETER Only
  Скачать только указанные id из каталога (например youtube,happ).
.PARAMETER ListOnly
  Показать план без скачивания и без подключения к телевизору.
.PARAMETER Force
  Скачать заново, даже если файл уже есть в apps\.
#>
[CmdletBinding()]
param(
    [string]$Ip,
    [string]$Serial,
    [string]$Folder,
    [string[]]$Only = @(),
    [switch]$ListOnly,
    [switch]$Force,
    [switch]$Yes,
    [switch]$AutoInstallTools
)
. (Join-Path $PSScriptRoot 'common.ps1')

if (-not $Folder) { $Folder = Join-Path (Split-Path -Parent $PSScriptRoot) 'apps' }
$apps = @(Get-AppSources)
if ($Only.Count -gt 0) { $apps = @($apps | Where-Object { $Only -contains $_.id }) }
if ($apps.Count -eq 0) { Write-Info "Каталог scripts\data\app-sources.json пуст."; return }

$installed = @()
if (-not $ListOnly) {
    New-Dir $Folder | Out-Null
    try {
        Write-Step "Подключение (чтобы не качать то, что уже стоит)"
        Initialize-Adb -Address $Ip -Serial $Serial -AutoInstallTools:$AutoInstallTools | Out-Null
        $serial = Select-Device
        $installed = @((ConvertFrom-PackageList (Get-ShellText 'pm list packages')) | ForEach-Object { $_.Package })
        Write-Ok "Устройство: $serial; пакетов: $($installed.Count)"
    } catch { Write-Warn "Телевизор недоступен ($($_.Exception.Message)) — качаем всё, чего нет в папке." }
}

function Invoke-Download([string]$Url, [string]$OutFile, [string[]]$Hosts) {
    Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.AllowAutoRedirect = $true
    $client = New-Object System.Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromMinutes(20)
    $client.DefaultRequestHeaders.UserAgent.ParseAdd('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ClearTV-get-apps/1.0')
    try {
        $resp = $client.GetAsync($Url, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        try {
            $final = $resp.RequestMessage.RequestUri
            if (-not $resp.IsSuccessStatusCode) { throw "HTTP $([int]$resp.StatusCode) $($resp.ReasonPhrase)" }
            if (-not (Test-HostAllowed $final.Host $Hosts)) { throw "итоговый адрес $($final.Host) не входит в официальные домены ($($Hosts -join ', ')) — файл не сохранён" }
            $tmp = "$OutFile.part"
            $fs = [System.IO.File]::Create($tmp)
            try { $resp.Content.CopyToAsync($fs).GetAwaiter().GetResult() } finally { $fs.Dispose() }
            Move-Item -Force $tmp $OutFile
            return $final.AbsoluteUri
        } finally { $resp.Dispose() }
    } finally { $client.Dispose() }
}
function Get-PageText([string]$Url) {
    Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromMinutes(2)
    $client.DefaultRequestHeaders.UserAgent.ParseAdd('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ClearTV-get-apps/1.0')
    try { return $client.GetStringAsync($Url).GetAwaiter().GetResult() } finally { $client.Dispose() }
}
function Test-ApkFile([string]$Path) {
    $fi = Get-Item $Path -ErrorAction SilentlyContinue
    if (-not $fi -or $fi.Length -lt 1MB) { return "файл слишком мал ($(if ($fi) { $fi.Length } else { 0 }) байт) — это не APK" }
    $fs = [System.IO.File]::OpenRead($Path); $b = New-Object byte[] 2; [void]$fs.Read($b, 0, 2); $fs.Dispose()
    if ($b[0] -ne 0x50 -or $b[1] -ne 0x4B) { return 'файл не является zip/APK (нет сигнатуры PK) — вероятно, скачалась страница' }
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
        $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
        try { if (-not ($zip.Entries | Where-Object { $_.FullName -eq 'AndroidManifest.xml' })) { return 'в архиве нет AndroidManifest.xml — это не APK' } } finally { $zip.Dispose() }
    } catch { return "архив повреждён: $($_.Exception.Message)" }
    return $null
}

$rows = @()
foreach ($a in $apps) {
    $kind = [string]$a.kind
    $name = [string]$a.name
    $skipPkgs = @($a.skip_if_installed) + @($a.packages) | Where-Object { $_ } | Select-Object -Unique
    $onTv = @($skipPkgs | Where-Object { $installed -contains $_ })
    $row = [ordered]@{ App = $name; Result = ''; File = ''; SizeMb = ''; Sha256 = ''; Source = [string]$a.source; Note = [string]$a.note }
    Write-Step $name
    if ($kind -eq 'none') { $row.Result = 'уже на телевизоре'; Write-Ok "$($a.note)" }
    elseif ($kind -eq 'manual') {
        $row.Result = 'официального APK нет'
        Write-Warn $a.note
        if ($a.page) { Write-Info "Официальная страница: $($a.page)" }
    }
    elseif ($onTv.Count -gt 0) { $row.Result = "уже установлено ($($onTv -join ', '))"; Write-Ok $row.Result }
    else {
        $out = Join-Path $Folder ([string]$a.file)
        if ($ListOnly) {
            $row.Result = 'план: скачать'
            Write-Info "$(if ($kind -eq 'page') { "страница $($a.page) → первая ссылка .apk с доменов $($a.hosts -join ', ')" } else { $a.url }) → $out"
            Write-Info "Источник: $($a.source)"; Write-Info $a.note
        }
        elseif ((Test-Path $out) -and -not $Force) { $row.Result = 'уже скачано'; $row.File = $out; Write-Ok "Уже в папке: $out (используйте -Force, чтобы скачать заново)" }
        else {
            try {
                $url = [string]$a.url
                if ($kind -eq 'page') {
                    Write-Info "Читаю официальную страницу $($a.page)"
                    $url = Select-ApkLink (Get-PageText ([string]$a.page)) ([string]$a.page) @($a.hosts)
                    if (-not $url) { throw "на странице не нашлось ссылки на .apk с доменов $($a.hosts -join ', ')" }
                }
                Write-Info "Скачиваю $url"
                Write-Info "Источник: $($a.source)"
                $final = Invoke-Download $url $out @($a.hosts)
                $problem = Test-ApkFile $out
                if ($problem) { Remove-Item $out -Force -ErrorAction SilentlyContinue; throw $problem }
                $fi = Get-Item $out
                $row.Result = 'скачано'; $row.File = $out; $row.SizeMb = [math]::Round($fi.Length / 1MB, 1)
                $row.Sha256 = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
                Write-Ok "Сохранено: $out ($($row.SizeMb) МБ), SHA-256 $($row.Sha256)"
                Write-Info $a.note
            } catch {
                $msg = $_.Exception.Message; if ($_.Exception.InnerException) { $msg += ' / ' + $_.Exception.InnerException.Message }
                $row.Result = "не скачано: $msg"
                Write-Fail "Не удалось скачать $name — $msg"
                $pg = if ($a.fallback_page) { [string]$a.fallback_page } elseif ($a.page) { [string]$a.page } else { '' }
                if ($pg) { Write-Info "Скачайте вручную со страницы $pg и положите файл в $Folder" }
            }
        }
    }
    $rows += [pscustomobject]$row
}

if (-not $ListOnly) {
    $md = New-Object System.Text.StringBuilder
    [void]$md.AppendLine("# Загрузка приложений владельца — $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Каталог источников: ``scripts/data/app-sources.json`` (только официальные GitHub Releases и сайты разработчиков). Папка: ``$Folder``.")
    [void]$md.AppendLine("")
    [void]$md.Append((ConvertTo-MarkdownTable $rows @('App', 'Result', 'File', 'SizeMb', 'Sha256', 'Source', 'Note')))
    New-Dir $ReportsDir | Out-Null
    Write-Utf8File (Join-Path $ReportsDir 'apps-download.md') $md.ToString()
    Write-Step "Итог"
    foreach ($r in $rows) { Write-Info "$($r.App): $($r.Result)" }
    Write-Info "Отчёт: reports\apps-download.md. Установка: install-apps.ps1 (run-all делает это следующим шагом)."
}
