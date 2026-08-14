[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv'
)

$ErrorActionPreference = 'Stop'
$validator = Join-Path $PSScriptRoot 'validate_official_catalog.py'
& python $validator --catalog $CatalogPath
if ($LASTEXITCODE -ne 0) {
    throw "Canonical catalog validation failed for $CatalogPath."
}
