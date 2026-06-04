# =========================================================
#  升版工具：一次更新所有版本號，避免版本漂移
#  用法： .\bump-version.ps1 1.2.0
#  會把 index.html / sw.js / version.json 內的舊版本字串
#  全部換成新版本（含 styles.css?v= / script.js?v= /
#  og:image?v= / BUILD_VERSION / PRECACHE）。
#  改完記得： git add -A; git commit; git push
#  （GitHub Pages 會自動重新部署，使用者下次開啟會收到更新提示）
# =========================================================
param([Parameter(Mandatory = $true)][string]$NewVersion)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$vj = Get-Content (Join-Path $root 'version.json') -Raw | ConvertFrom-Json
$old = $vj.version
if ($old -eq $NewVersion) { Write-Host "版本已是 $NewVersion，無需更新"; exit 0 }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($f in @('index.html', 'sw.js', 'version.json')) {
  $p = Join-Path $root $f
  $c = [System.IO.File]::ReadAllText($p)
  $n = $c.Replace($old, $NewVersion)
  [System.IO.File]::WriteAllText($p, $n, $utf8NoBom)
  Write-Host ("更新 {0}：{1} -> {2}" -f $f, $old, $NewVersion)
}
Write-Host ""
Write-Host "完成！接著執行： git add -A; git commit -m 'bump v$NewVersion'; git push"
