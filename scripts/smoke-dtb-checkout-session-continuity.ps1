Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$platform = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw $Message }
}
function Read-RequiredText {
    param([string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required checkout source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$bootstrap = Read-RequiredText (Join-Path $platform 'bootstrap.php')
$guard = Read-RequiredText (Join-Path $platform 'Auth/CheckoutSessionContinuityGuard.php')
$taxBootstrap = Read-RequiredText (Join-Path $commerce 'bootstrap.php')
$taxPresentation = Read-RequiredText (Join-Path $commerce 'Validation/CheckoutTaxPresentation.php')

Assert-True ($bootstrap.Contains("Auth/CheckoutSessionContinuityGuard.php")) 'Platform bootstrap must load checkout session continuity guard.'
Assert-True ($guard.Contains("'determine_current_user'")) 'Continuity guard must resolve verified DTB identity before native checkout conflict handling.'
Assert-True ($guard.Contains("'rest_post_dispatch'")) 'Continuity guard must protect REST auth convergence from stale native-cookie cart destruction.'
Assert-True (-not $guard.Contains('woocommerce_cart_hash')) 'Continuity guard must not expire Woo cart hash cookies.'
Assert-True (-not $guard.Contains('woocommerce_items_in_cart')) 'Continuity guard must not expire Woo cart marker cookies.'
Assert-True (-not $guard.Contains('wp_woocommerce_session_')) 'Continuity guard must not expire Woo session cookies.'
Assert-True (-not $guard.Contains('WC()->session')) 'Continuity guard must not initialize or mutate Woo sessions.'
Assert-True ($taxBootstrap.Contains('Validation/CheckoutTaxPresentation.php')) 'Commerce bootstrap must load storefront tax label policy.'
Assert-True ($taxBootstrap.Contains('DTB_CheckoutTaxPresentation::register()')) 'Commerce bootstrap must register storefront tax label policy.'
Assert-True ($taxPresentation.Contains("'woocommerce_rate_label'")) 'Tax label policy must use Woo supported rate-label filter.'
Assert-True ($taxPresentation.Contains("__( 'Tax', 'drywall-toolbox' )")) 'Storefront tax label must normalize to Tax.'

Write-Host 'DTB checkout session continuity/tax-label static smoke checks passed.' -ForegroundColor Green
