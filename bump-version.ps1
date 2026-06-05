# =========================================================
#  Version bump tool -- update all version strings at once
#  Usage:  .\bump-version.ps1 1.2.0
#  Updates index.html / sw.js / version.json (styles.css?v= ,
#  script.js?v= , og:image?v= , BUILD_VERSION , PRECACHE).
#  After running:  git add -A; git commit -m "bump v1.2.0"; git push
#  (ASCII-only on purpose: Windows PowerShell 5.1 reads .ps1 as
#   cp950 and garbles non-ASCII, which can break -f format strings.)
# =========================================================
param([Parameter(Mandatory = $true)][string]$NewVersion)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
# Read as UTF-8 and regex the version out (avoids cp950 mis-read + ConvertFrom-Json
# choking on non-ASCII "notes").
$vjText = [System.IO.File]::ReadAllText((Join-Path $root 'version.json'))
$m = [regex]::Match($vjText, '"version"\s*:\s*"([^"]+)"')
if (-not $m.Success) { Write-Error "Cannot find version in version.json"; exit 1 }
$old = $m.Groups[1].Value
if ($old -eq $NewVersion) { Write-Host "Already at $NewVersion, nothing to do."; exit 0 }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($f in @('index.html', 'sw.js', 'version.json', 'wish.html', 'stage.html')) {
  $p = Join-Path $root $f
  $c = [System.IO.File]::ReadAllText($p)
  $n = $c.Replace($old, $NewVersion)
  [System.IO.File]::WriteAllText($p, $n, $utf8NoBom)
  Write-Host ("Updated " + $f + " : " + $old + " -> " + $NewVersion)
}

# Safety: warn if the OLD version still lingers anywhere (drift guard).
$leftover = Get-ChildItem -Path $root -Include *.html, *.js, *.json, *.webmanifest -Recurse -File |
  Where-Object { $_.Name -ne 'bump-version.ps1' } |
  Select-String -SimpleMatch -Pattern $old
if ($leftover) {
  Write-Host ""
  Write-Host "WARNING: old version '$old' still found in:" -ForegroundColor Yellow
  $leftover | ForEach-Object { Write-Host ("  " + $_.Path + " : line " + $_.LineNumber) -ForegroundColor Yellow }
  Write-Host "Fix these so the SW update prompt does not keep firing." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Done. Next: git add -A; git commit -m 'bump v$NewVersion'; git push"
