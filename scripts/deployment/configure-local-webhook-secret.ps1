[CmdletBinding()]
param(
	[Parameter( Mandatory = $true )]
	[switch] $Rotate,

	[string] $Repository = 'elliotttmiller/launch-dtb',

	[string] $WpConfigPath = 'drywalltoolbox/wp/wp-config.php'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ( -not $Rotate ) {
	throw 'Pass -Rotate to acknowledge rotation of DTB_DEPLOYMENT_WEBHOOK_SECRET.'
}

$repositoryRoot = ( Resolve-Path ( Join-Path $PSScriptRoot '..\..' ) ).Path.TrimEnd( '\', '/' )
$resolvedConfig = ( Resolve-Path ( Join-Path $repositoryRoot $WpConfigPath ) ).Path

if ( -not $resolvedConfig.StartsWith( "$repositoryRoot\", [StringComparison]::OrdinalIgnoreCase ) ) {
	throw 'Refusing to update a wp-config.php outside the repository workspace.'
}

$originalBytes = [IO.File]::ReadAllBytes( $resolvedConfig )
$hasUtf8Bom = $originalBytes.Length -ge 3 `
	-and $originalBytes[0] -eq 0xEF `
	-and $originalBytes[1] -eq 0xBB `
	-and $originalBytes[2] -eq 0xBF
$encoding = [Text.UTF8Encoding]::new( $hasUtf8Bom )
$contentOffset = if ( $hasUtf8Bom ) { 3 } else { 0 }
$original = $encoding.GetString( $originalBytes, $contentOffset, $originalBytes.Length - $contentOffset )

$constantPattern = '(?m)^(?<prefix>\s*define\(\s*[''"]DTB_DEPLOYMENT_WEBHOOK_SECRET[''"]\s*,\s*[''"])(?<value>[^''"]*)(?<suffix>[''"]\s*\)\s*;)'
$constantMatches = [regex]::Matches( $original, $constantPattern )

if ( 1 -ne $constantMatches.Count ) {
	throw "Expected exactly one DTB_DEPLOYMENT_WEBHOOK_SECRET definition; found $($constantMatches.Count)."
}

$randomBytes = [byte[]]::new( 32 )
[Security.Cryptography.RandomNumberGenerator]::Fill( $randomBytes )
$secret = [Convert]::ToHexString( $randomBytes ).ToLowerInvariant()

if ( $secret -cnotmatch '^[0-9a-f]{64}$' ) {
	throw 'Generated webhook secret failed the 32-byte hexadecimal format check.'
}

$updated = [regex]::Replace(
	$original,
	$constantPattern,
	{
		param( $match )
		$match.Groups['prefix'].Value + $secret + $match.Groups['suffix'].Value
	},
	1
)

if ( $updated -ceq $original ) {
	throw 'The prepared wp-config.php update did not change the webhook secret.'
}

$temporaryPath = "$resolvedConfig.dtb-update-$([guid]::NewGuid().ToString( 'N' ))"

try {
	[IO.File]::WriteAllText( $temporaryPath, $updated, $encoding )

	$processInfo = [Diagnostics.ProcessStartInfo]::new( 'gh' )
	foreach ( $argument in @( 'secret', 'set', 'DTB_DEPLOYMENT_WEBHOOK_SECRET', '--repo', $Repository ) ) {
		$processInfo.ArgumentList.Add( $argument )
	}

	$processInfo.RedirectStandardInput = $true
	$processInfo.RedirectStandardOutput = $true
	$processInfo.RedirectStandardError = $true
	$processInfo.UseShellExecute = $false

	$process = [Diagnostics.Process]::Start( $processInfo )
	$process.StandardInput.Write( $secret )
	$process.StandardInput.Close()
	$null = $process.StandardOutput.ReadToEnd()
	$errorOutput = $process.StandardError.ReadToEnd()
	$process.WaitForExit()

	if ( 0 -ne $process.ExitCode ) {
		throw "GitHub secret update failed with exit code $($process.ExitCode): $errorOutput"
	}

	[IO.File]::Move( $temporaryPath, $resolvedConfig, $true )

	$finalContent = [IO.File]::ReadAllText( $resolvedConfig, $encoding )
	$finalMatch = [regex]::Match( $finalContent, $constantPattern )
	$finalValue = $finalMatch.Groups['value'].Value

	if ( $finalValue -cne $secret -or $finalValue -cnotmatch '^[0-9a-f]{64}$' ) {
		throw 'Local wp-config.php verification failed after the GitHub secret update.'
	}

	[pscustomobject]@{
		LocalConstantUpdated         = $true
		GitHubSecretUpdated          = $true
		SameGeneratedValueSentToBoth = $true
		SecretLength                 = $finalValue.Length
		DefinitionCount              = ( [regex]::Matches( $finalContent, $constantPattern ) ).Count
	}
} finally {
	if ( Test-Path -LiteralPath $temporaryPath ) {
		Remove-Item -LiteralPath $temporaryPath -Force
	}

	if ( $randomBytes ) {
		[Array]::Clear( $randomBytes, 0, $randomBytes.Length )
	}

	$secret = $null
}
