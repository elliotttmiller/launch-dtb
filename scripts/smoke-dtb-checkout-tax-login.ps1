Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

function Read-RequiredText {
    param([Parameter(Mandatory = $true)] [string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required checkout source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$bootstrap = Read-RequiredText (Join-Path $commerce 'bootstrap.php')
$taxReadiness = Read-RequiredText (Join-Path $commerce 'Validation/CheckoutTaxReadiness.php')
$fieldPolicy = Read-RequiredText (Join-Path $commerce 'Validation/CheckoutFieldPolicy.php')
$template = Read-RequiredText (Join-Path $theme 'templates/checkout/native-checkout.php')
$loginHandoff = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-login-handoff.js')
$contactIdentity = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-contact-identity.js')
$ui = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-ui.js')

Assert-True ($bootstrap.Contains("Validation/CheckoutTaxReadiness.php")) 'Commerce bootstrap must load tax readiness diagnostics.'
Assert-True ($bootstrap.Contains('DTB_CheckoutTaxReadiness::register()')) 'Commerce bootstrap must register tax readiness diagnostics.'
Assert-True ($taxReadiness.Contains('wc_tax_enabled')) 'Tax readiness must use WooCommerce tax enablement as the authority.'
Assert-True ($taxReadiness.Contains("'country'   => 'US'")) 'Tax readiness must probe the configured US jurisdiction.'
Assert-True ($taxReadiness.Contains("'state'     => 'MN'")) 'Tax readiness must probe the configured Minnesota jurisdiction.'
Assert-True (-not ($taxReadiness -match '6\.875|0\.06875')) 'DTB source must not hard-code the operator-managed Minnesota tax rate.'
Assert-True (-not $fieldPolicy.Contains('woocommerce_register_additional_checkout_field')) 'Duplicate DTB checkout identity fields must remain retired.'

Assert-True ($template.Contains("'dtb-checkout-theme-login-handoff'")) 'Native checkout must enqueue the storefront login handoff guard.'
Assert-True ($loginHandoff.Contains('/login?returnTo=%2Fcheckout')) 'Checkout login must return through the storefront login route.'
Assert-True ($loginHandoff.Contains('event.preventDefault()')) 'Checkout login handoff must suppress the native My Account navigation.'
Assert-True ($loginHandoff.Contains('event.stopPropagation()')) 'Checkout login handoff must stop Woo/React delegated navigation from restoring My Account.'
Assert-True ($loginHandoff.Contains('window.location.assign')) 'Checkout login must perform an explicit full-document storefront handoff.'
Assert-True ($loginHandoff.Contains('MutationObserver')) 'Checkout login links must be rebound after Checkout Block rerenders.'

Assert-True ($contactIdentity.Contains('data-dtb-contact-identity-proxy')) 'Mobile Contact must render theme-owned canonical identity presentation proxies.'
Assert-True ($contactIdentity.Contains("key: 'first_name'")) 'Mobile Contact must include first name presentation.'
Assert-True ($contactIdentity.Contains("key: 'last_name'")) 'Mobile Contact must include last name presentation.'
Assert-True ($contactIdentity.Contains("key: 'phone'")) 'Mobile Contact must include phone presentation.'
Assert-True ($contactIdentity.Contains('setNativeInputValue')) 'Contact proxies must synchronize into canonical Woo fields.'
Assert-True ($contactIdentity.Contains('hardenContactNextButton')) 'Mobile Contact must harden the Continue control against unrelated background recalculation state.'
Assert-True ($ui.Contains("next.addEventListener( 'click'")) 'Primary mobile Continue control must retain a direct click handler.'
Assert-True ($ui.Contains('totals.total_tax')) 'Checkout live summary must render Woo-authoritative tax totals.'
Assert-True ($ui.Contains('totals.total_shipping')) 'Checkout live summary must render Woo-authoritative shipping totals.'

Write-Host 'DTB checkout tax/login/contact static smoke checks passed.' -ForegroundColor Green
