function Assert-CanonicalCatalog {
    param([Parameter(Mandatory)] [string] $CatalogPath)
    $validator = Join-Path $PSScriptRoot 'validate_official_catalog.py'
    & python $validator --catalog $CatalogPath
    if ($LASTEXITCODE -ne 0) {
        throw "Canonical catalog validation failed for $CatalogPath."
    }
}

function New-CatalogRollbackSnapshot {
    param([Parameter(Mandatory)] [string] $CatalogPath)
    $backupPath = "$CatalogPath.bak"
    $temporaryBackup = "$backupPath.tmp"
    try {
        Copy-Item -LiteralPath $CatalogPath -Destination $temporaryBackup -Force
        Move-Item -LiteralPath $temporaryBackup -Destination $backupPath -Force
    }
    finally {
        if (Test-Path -LiteralPath $temporaryBackup) {
            Remove-Item -LiteralPath $temporaryBackup -Force
        }
    }
    return $backupPath
}
