[CmdletBinding()]
param(
    [string] $OfficialCatalog = 'products\launch\official\dtb_official_catalog.csv',
    [string] $VeeqoImport = 'products\launch\official\veeqo_inventory.csv',
    [string] $Python = 'python',
    [switch] $Apply
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptPath = Join-Path $PSScriptRoot 'rebuild_veeqo_inventory_import.py'
$arguments = @($scriptPath, '--catalog', $OfficialCatalog, '--output', $VeeqoImport)
if ($Apply) { $arguments += '--apply' }
& $Python @arguments
if ($LASTEXITCODE -ne 0) { throw 'Veeqo product import projection build failed.' }
