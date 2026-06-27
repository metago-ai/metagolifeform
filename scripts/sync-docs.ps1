#requires -Version 5.1
<#
.SYNOPSIS
    MetaGO living-doc sync script (sync-docs.ps1)

.DESCRIPTION
    1. Scan docs/*.md YAML front-matter blocks.
    2. Check version consistency across docs and against metago-lifeform/package.json.
    3. Check skills directory count against package.json metago.skills.
    4. Emit a sync status report (console + docs/_sync-report.md).
    5. Optionally auto-update doc versions (-Version <ver> or -SyncFromPackage).

.PARAMETER Version
    Normalize every doc YAML `version:` to this value.

.PARAMETER SyncFromPackage
    Use package.json version as the authoritative source and sync docs to it.

.PARAMETER ReportPath
    Report file path. Default: <docs>/_sync-report.md

.PARAMETER NoReportFile
    Skip writing the report file (console only).

.EXAMPLE
    .\sync-docs.ps1
    .\sync-docs.ps1 -Version 36.5.0
    .\sync-docs.ps1 -SyncFromPackage
#>
[CmdletBinding()]
param(
    [string]$Version,
    [switch]$SyncFromPackage,
    [string]$ReportPath,
    [switch]$NoReportFile
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try { [Console]::OutputEncoding = $utf8NoBom } catch { }
$OutputEncoding = $utf8NoBom

# --- locate docs/ and package.json via $PSScriptRoot (no Chinese literals) ---
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$docsDirObj = Resolve-Path -LiteralPath (Join-Path $scriptDir '..\..\docs')
$pkgPathObj = Resolve-Path -LiteralPath (Join-Path $scriptDir '..\package.json')
$skillsDir  = Join-Path $scriptDir '..\skills'
$docsDir    = $docsDirObj.Path
$pkgPath    = $pkgPathObj.Path

if (-not $ReportPath) { $ReportPath = Join-Path $docsDir '_sync-report.md' }

# --- 1. read package.json (authoritative code version + declared skill count) ---
$pkgText = [System.IO.File]::ReadAllText($pkgPath, $utf8NoBom)
$pkg     = $pkgText | ConvertFrom-Json
$pkgVersion = $pkg.version
$pkgSkills  = [int]$pkg.metago.skills

# count skill sub-directories under metago-lifeform/skills
$skillCount = 0
if (Test-Path -LiteralPath $skillsDir) {
    $skillCount = @(Get-ChildItem -LiteralPath $skillsDir -Directory -ErrorAction SilentlyContinue).Count
}

# --- 2. scan docs/*.md, parse YAML front-matter ---
$mdFiles = Get-ChildItem -LiteralPath $docsDir -Filter '*.md'
$rows = New-Object System.Collections.Generic.List[object]
$verMap = @{}
$yamlOk = 0; $yamlMiss = 0
foreach ($f in $mdFiles) {
    # skip generated/internal artifacts (underscore-prefixed, e.g. _sync-report.md)
    if ($f.Name -like '_*') { continue }
    $text = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
    $row = [ordered]@{
        file    = $f.Name
        hasYaml = $false
        doc_id  = ''
        title   = ''
        version = ''
    }
    if ($text -match '(?ms)^---\r?\ndoc_id:\s*([^\r\n]+)\r?\ntitle:\s*([^\r\n]+)\r?\nversion:\s*([^\r\n]+)') {
        $row.hasYaml = $true
        $row.doc_id  = $matches[1].Trim()
        $row.title   = $matches[2].Trim()
        $row.version = $matches[3].Trim()
        $yamlOk++
        if (-not $verMap.ContainsKey($row.version)) { $verMap[$row.version] = 0 }
        $verMap[$row.version]++
    } else {
        $yamlMiss++
    }
    $rows.Add([pscustomobject]$row)
}

# --- 3. determine target version (if updating) ---
$target = $null
if ($SyncFromPackage -and $Version) {
    throw "Specify either -SyncFromPackage OR -Version, not both."
}
if ($SyncFromPackage) { $target = $pkgVersion }
elseif ($Version)     { $target = $Version }

# --- 4. auto-update doc versions when requested ---
$updated = 0
if ($target) {
    foreach ($r in $rows) {
        if (-not $r.hasYaml) { continue }
        if ($r.version -ceq $target) { continue }
        $p = Join-Path $docsDir $r.file
        $t = [System.IO.File]::ReadAllText($p, $utf8NoBom)
        if ($t -match '(?s)^(---\r?\n)(.*?)(\r?\n---\r?\n)(.*)$') {
            $fmHead = $matches[1]; $fmBody = $matches[2]; $fmTail = $matches[3]; $rest = $matches[4]
            $fmBodyNew = $fmBody -replace '(?m)^(version:\s*).*$', "version: $target"
            $new = $fmHead + $fmBodyNew + $fmTail + $rest
            if ($new -ne $t) {
                [System.IO.File]::WriteAllText($p, $new, $utf8NoBom)
                # maintain version map accurately: decrement old, increment new
                $oldVer = $r.version
                if ($verMap.ContainsKey($oldVer)) {
                    $verMap[$oldVer]--
                    if ($verMap[$oldVer] -le 0) { $verMap.Remove($oldVer) }
                }
                $r.version = $target
                if (-not $verMap.ContainsKey($target)) { $verMap[$target] = 0 }
                $verMap[$target]++
                $updated++
            }
        }
    }
}

# --- 5. compute diagnostics ---
$docVersions = @($verMap.Keys | Sort-Object)
$docsConsistent = ($docVersions.Count -le 1)
$dominant = if ($docVersions.Count -ge 1) { $docVersions[0] } else { $null }
$docsVsPkg = ($dominant -ceq $pkgVersion)
$skillsOk  = ($skillCount -eq $pkgSkills)

$exitCode = 0
if ($yamlMiss -gt 0)          { $exitCode = 1 }
if (-not $docsConsistent)     { $exitCode = 1 }
if (-not $docsVsPkg)          { $exitCode = 1 }
if (-not $skillsOk)           { $exitCode = 1 }

# --- 6. build report ---
$lines = New-Object System.Collections.Generic.List[string]
$W = { param($s) $lines.Add($s) }

& $W "# MetaGO Living-Doc Sync Report"
& $W ""
& $W "- generated : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
& $W "- docs dir  : $docsDir"
& $W "- package   : $pkgPath"
& $W "- package version : $pkgVersion"
& $W "- package metago.skills : $pkgSkills"
& $W "- skills dir count : $skillCount"
& $W ""
& $W "## Summary"
& $W ""
& $W "| check | result | detail |"
& $W "|---|---|---|"
& $W "| md files scanned | $([int]$mdFiles.Count) | - |"
& $W "| yaml front-matter ok | $yamlOk | - |"
& $W "| yaml front-matter missing | $yamlMiss | $(if($yamlMiss -eq 0){'ok'}else{'NEEDS FIX'}) |"
& $W "| doc versions consistent | $docsConsistent | distinct=$($docVersions.Count) ($($docVersions -join ', ')) |"
& $W "| docs vs package version | $docsVsPkg | docs=$dominant pkg=$pkgVersion |"
& $W "| skills count vs package | $skillsOk | dir=$skillCount declared=$pkgSkills |"
& $W ""
& $W "## Per-file"
& $W ""
& $W "| file | doc_id | version | yaml |"
& $W "|---|---|---|---|"
foreach ($r in $rows) {
    $y = if ($r.hasYaml) { 'ok' } else { 'MISSING' }
    & $W "| $($r.file) | $($r.doc_id) | $($r.version) | $y |"
}
& $W ""
if ($target) {
    & $W "## Update"
    & $W ""
    & $W "- target version : $target"
    & $W "- files updated  : $updated"
    & $W ""
}
& $W "## Exit code"
& $W ""
& $W "``$exitCode``  (0 = synced; 1 = drift/unfixed detected)"
& $W ""

$report = ($lines -join "`r`n")

# console
Write-Host $report

# report file
if (-not $NoReportFile) {
    [System.IO.File]::WriteAllText($ReportPath, $report, $utf8NoBom)
    Write-Host ""
    Write-Host "report written: $ReportPath"
}

exit $exitCode
