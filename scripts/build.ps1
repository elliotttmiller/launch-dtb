$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location (Join-Path $repoRoot 'frontend')
npm run build