[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv',
    [string] $ReportPath = 'products\dev\catalog-enrichment\seo-canonical-cleanup.json',
    [switch] $Apply
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'catalog-write-guard.ps1')

$catalog = (Resolve-Path -LiteralPath $CatalogPath).Path
$script = Join-Path $PSScriptRoot 'clear_legacy_seo_canonicals.py'

Assert-CanonicalCatalog -CatalogPath $catalog

$args = @($script, '--catalog', $catalog, '--report', $ReportPath)
if ($Apply) {
    $backup = New-CatalogRollbackSnapshot -CatalogPath $catalog
    Write-Host "Rollback snapshot: $backup"
    $args += '--apply'
}

& python @args
if ($LASTEXITCODE -ne 0) {
    throw "SEO canonical cleanup failed for $catalog."
}

if ($Apply) {
    Assert-CanonicalCatalog -CatalogPath $catalog
}
