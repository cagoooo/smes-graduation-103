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
$vj = Get-Content (Join-Path $root 'version.json') -Raw | ConvertFrom-Json
$old = $vj.version
if ($old -eq $NewVersion) { Write-Host "Already at $NewVersion, nothing to do."; exit 0 }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($f in @('index.html', 'sw.js', 'version.json')) {
  $p = Join-Path $root $f
  $c = [System.IO.File]::ReadAllText($p)
  $n = $c.Replace($old, $NewVersion)
  [System.IO.File]::WriteAllText($p, $n, $utf8NoBom)
  Write-Host ("Updated " + $f + " : " + $old + " -> " + $NewVersion)
}
Write-Host ""
Write-Host "Done. Next: git add -A; git commit -m 'bump v$NewVersion'; git push"
