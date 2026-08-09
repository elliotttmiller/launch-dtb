[CmdletBinding(SupportsShouldProcess)]
param(
    [string] $MediaDirectory = 'products\launch\media\media',
    [string] $QuarantineDirectory = 'products\launch\media\_quarantine\2026-08-09-media-cleanup',
    [switch] $Apply
)

$ErrorActionPreference = 'Stop'

function Get-RelativePath {
    param(
        [Parameter(Mandatory)] [string] $BasePath,
        [Parameter(Mandatory)] [string] $Path
    )

    return [System.IO.Path]::GetRelativePath($BasePath, $Path).Replace('\', '/')
}

function Get-ImageFormat {
    param([Parameter(Mandatory)] [string] $Path)

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $header = [byte[]]::new(16)
        $read = $stream.Read($header, 0, $header.Length)
    } finally {
        $stream.Dispose()
    }

    if (
        $read -ge 12 -and
        [System.Text.Encoding]::ASCII.GetString($header, 0, 4) -eq 'RIFF' -and
        [System.Text.Encoding]::ASCII.GetString($header, 8, 4) -eq 'WEBP'
    ) {
        return 'webp'
    }
    if ($read -ge 8 -and ($header[0..7] -join ',') -eq '137,80,78,71,13,10,26,10') {
        return 'png'
    }
    if ($read -ge 3 -and $header[0] -eq 0xFF -and $header[1] -eq 0xD8 -and $header[2] -eq 0xFF) {
        return 'jpg'
    }
    if ($read -ge 12 -and [System.Text.Encoding]::ASCII.GetString($header, 4, 8) -eq 'ftypavif') {
        return 'avif'
    }

    return 'unknown'
}

function Get-CanonicalDerivativeName {
    param([Parameter(Mandatory)] [System.IO.FileInfo] $File)

    $stem = $File.BaseName
    if ($stem -notmatch '-scaled(?:-\d+x\d+)?$' -and $stem -notmatch '-\d+x\d+$') {
        return $null
    }

    $canonicalStem = $stem -replace '-scaled(?:-\d+x\d+)?$', '' -replace '-\d+x\d+$', ''
    return $canonicalStem + $File.Extension.ToLowerInvariant()
}

function Get-TextFiles {
    param([Parameter(Mandatory)] [string] $Workspace)

    $roots = @(
        'products\launch\official',
        'frontend\src',
        'drywalltoolbox\wp\wp-content\mu-plugins',
        'scripts',
        'docs'
    )
    $extensions = @('.csv', '.json', '.php', '.js', '.jsx', '.cjs', '.mjs', '.ps1', '.md', '.txt')

    foreach ($root in $roots) {
        $absoluteRoot = Join-Path $Workspace $root
        if (-not (Test-Path -LiteralPath $absoluteRoot -PathType Container)) {
            continue
        }
        Get-ChildItem -LiteralPath $absoluteRoot -File -Recurse |
            Where-Object {
                $_.Extension.ToLowerInvariant() -in $extensions -and
                $_.FullName.IndexOf(
                    [System.IO.Path]::Combine('docs', '_working', 'legacy-dist'),
                    [System.StringComparison]::OrdinalIgnoreCase
                ) -lt 0
            }
    }
}

function Read-Utf8File {
    param([Parameter(Mandatory)] [string] $Path)

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    $offset = if ($hasBom) { 3 } else { 0 }
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, $offset, $bytes.Length - $offset)
    return [pscustomobject]@{
        Text = $text
        HasBom = $hasBom
    }
}

function Write-Utf8File {
    param(
        [Parameter(Mandatory)] [string] $Path,
        [Parameter(Mandatory)] [string] $Text,
        [Parameter(Mandatory)] [bool] $HasBom
    )

    $encoding = [System.Text.UTF8Encoding]::new($HasBom)
    $temporaryPath = $Path + '.dtb-media-cleanup.tmp'
    [System.IO.File]::WriteAllText($temporaryPath, $Text, $encoding)
    Move-Item -LiteralPath $temporaryPath -Destination $Path -Force
}

$workspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$media = (Resolve-Path -LiteralPath (Join-Path $workspace $MediaDirectory)).Path
$quarantine = [System.IO.Path]::GetFullPath((Join-Path $workspace $QuarantineDirectory))

if (-not $media.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Media directory resolves outside the workspace: $media"
}
if (-not $quarantine.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Quarantine directory resolves outside the workspace: $quarantine"
}
if ($quarantine.StartsWith($media + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Quarantine directory must be outside the cleaned media directory.'
}

$files = @(Get-ChildItem -LiteralPath $media -File)
if ($files.Count -eq 0) {
    throw "No files found in media directory: $media"
}
if (@(Get-ChildItem -LiteralPath $media -Directory).Count -gt 0) {
    throw 'The media directory must be flat before cleanup.'
}

$actions = [System.Collections.Generic.List[object]]::new()
$replacementMap = [ordered]@{}
$derivativeFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$formatRenames = [System.Collections.Generic.List[object]]::new()

foreach ($file in $files) {
    $canonicalName = Get-CanonicalDerivativeName -File $file
    if ($canonicalName) {
        $canonicalPath = Join-Path $media $canonicalName
        if (-not (Test-Path -LiteralPath $canonicalPath -PathType Leaf)) {
            throw "Derivative has no canonical original: $($file.Name) -> $canonicalName"
        }
        $replacementMap[$file.Name] = $canonicalName
        $derivativeFiles.Add($file)
        continue
    }

    $format = Get-ImageFormat -Path $file.FullName
    if ($format -eq 'unknown') {
        throw "Unsupported or unreadable image file: $($file.Name)"
    }
    $expectedExtension = '.' + $format
    if ($file.Extension.ToLowerInvariant() -ne $expectedExtension) {
        $renamed = $file.BaseName + $expectedExtension
        if (Test-Path -LiteralPath (Join-Path $media $renamed)) {
            throw "Format-correct filename already exists: $renamed"
        }
        $replacementMap[$file.Name] = $renamed
        $formatRenames.Add([pscustomobject]@{
            File = $file
            DestinationName = $renamed
            Format = $format
        })
    }
}

$textFiles = @(Get-TextFiles -Workspace $workspace | Sort-Object FullName -Unique)
$changedTextFiles = [System.Collections.Generic.List[object]]::new()
$projectedReferences = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($textFile in $textFiles) {
    $loaded = Read-Utf8File -Path $textFile.FullName
    $updated = $loaded.Text
    foreach ($entry in $replacementMap.GetEnumerator()) {
        $updated = $updated.Replace(
            [string] $entry.Key,
            [string] $entry.Value,
            [System.StringComparison]::OrdinalIgnoreCase
        )
    }
    if ($updated -cne $loaded.Text) {
        $changedTextFiles.Add([pscustomobject]@{
            File = $textFile
            OriginalText = $loaded.Text
            UpdatedText = $updated
            HasBom = $loaded.HasBom
        })
    }
    foreach ($file in $files) {
        $projectedName = if ($replacementMap.Contains($file.Name)) {
            [string] $replacementMap[$file.Name]
        } else {
            $file.Name
        }
        if ($updated.IndexOf($projectedName, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            [void] $projectedReferences.Add($projectedName)
        }
    }
}

# Exact-byte duplicates are not automatically redundant: distinct SKU filenames
# may intentionally share the same photography. Remove only an unreferenced alias
# when another member of its hash group remains, preferring referenced names.
$remainingFiles = @($files | Where-Object { $_.FullName -notin $derivativeFiles.FullName })
$exactRedundantFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$hashGroups = $remainingFiles | Get-FileHash -Algorithm SHA256 | Group-Object Hash | Where-Object { $_.Count -gt 1 }
foreach ($group in $hashGroups) {
    $members = @($group.Group | ForEach-Object { Get-Item -LiteralPath $_.Path })
    $ranked = @($members | Sort-Object @{
        Expression = {
            $projectedName = if ($replacementMap.Contains($_.Name)) { [string] $replacementMap[$_.Name] } else { $_.Name }
            if ($projectedReferences.Contains($projectedName)) { 0 } else { 1 }
        }
    }, Name)
    $keeper = $ranked[0]
    foreach ($member in $ranked | Select-Object -Skip 1) {
        $projectedName = if ($replacementMap.Contains($member.Name)) { [string] $replacementMap[$member.Name] } else { $member.Name }
        if (-not $projectedReferences.Contains($projectedName)) {
            $exactRedundantFiles.Add($member)
        }
    }
}

$summary = [ordered]@{
    mode = if ($Apply) { 'apply' } else { 'dry-run' }
    media_directory = Get-RelativePath -BasePath $workspace -Path $media
    quarantine_directory = Get-RelativePath -BasePath $workspace -Path $quarantine
    files_before = $files.Count
    derivative_files = $derivativeFiles.Count
    format_extension_corrections = $formatRenames.Count
    unreferenced_exact_duplicates = $exactRedundantFiles.Count
    reference_files_changed = $changedTextFiles.Count
    files_after = $files.Count - $derivativeFiles.Count - $exactRedundantFiles.Count
    changed_reference_files = @($changedTextFiles | ForEach-Object {
        Get-RelativePath -BasePath $workspace -Path $_.File.FullName
    })
    quarantined_exact_duplicate_names = @($exactRedundantFiles | ForEach-Object { $_.Name })
}

if (-not $Apply) {
    $summary | ConvertTo-Json
    exit 0
}

$derivedQuarantine = Join-Path $quarantine 'generated-derivatives'
$duplicateQuarantine = Join-Path $quarantine 'exact-duplicates'
$backupRoot = Join-Path $quarantine 'reference-backups'
[System.IO.Directory]::CreateDirectory($derivedQuarantine) | Out-Null
[System.IO.Directory]::CreateDirectory($duplicateQuarantine) | Out-Null
[System.IO.Directory]::CreateDirectory($backupRoot) | Out-Null

foreach ($change in $changedTextFiles) {
    $relative = Get-RelativePath -BasePath $workspace -Path $change.File.FullName
    $backupPath = Join-Path $backupRoot $relative
    [System.IO.Directory]::CreateDirectory((Split-Path $backupPath -Parent)) | Out-Null
    Copy-Item -LiteralPath $change.File.FullName -Destination $backupPath
    Write-Utf8File -Path $change.File.FullName -Text $change.UpdatedText -HasBom $change.HasBom
    $actions.Add([pscustomobject]@{
        action = 'update_references'
        source = $relative
        destination = $relative
        sha256 = (Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash.ToLowerInvariant()
        bytes = (Get-Item -LiteralPath $backupPath).Length
    })
}

foreach ($rename in $formatRenames) {
    $source = $rename.File.FullName
    $destination = Join-Path $media $rename.DestinationName
    Move-Item -LiteralPath $source -Destination $destination
    $actions.Add([pscustomobject]@{
        action = 'correct_extension'
        source = Get-RelativePath -BasePath $workspace -Path $source
        destination = Get-RelativePath -BasePath $workspace -Path $destination
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
        bytes = (Get-Item -LiteralPath $destination).Length
    })
}

foreach ($file in $derivativeFiles) {
    $destination = Join-Path $derivedQuarantine $file.Name
    Move-Item -LiteralPath $file.FullName -Destination $destination
    $actions.Add([pscustomobject]@{
        action = 'quarantine_derivative'
        source = Get-RelativePath -BasePath $workspace -Path $file.FullName
        destination = Get-RelativePath -BasePath $workspace -Path $destination
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
        bytes = (Get-Item -LiteralPath $destination).Length
    })
}

foreach ($file in $exactRedundantFiles) {
    $destination = Join-Path $duplicateQuarantine $file.Name
    Move-Item -LiteralPath $file.FullName -Destination $destination
    $actions.Add([pscustomobject]@{
        action = 'quarantine_exact_duplicate'
        source = Get-RelativePath -BasePath $workspace -Path $file.FullName
        destination = Get-RelativePath -BasePath $workspace -Path $destination
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
        bytes = (Get-Item -LiteralPath $destination).Length
    })
}

$manifestPath = Join-Path $quarantine 'cleanup-manifest.csv'
$actions | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding utf8BOM
$summaryPath = Join-Path $quarantine 'cleanup-summary.json'
$summary | ConvertTo-Json | Set-Content -LiteralPath $summaryPath -Encoding utf8

$summary | ConvertTo-Json
