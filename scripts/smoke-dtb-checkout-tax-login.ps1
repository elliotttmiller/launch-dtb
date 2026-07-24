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
$ui = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-ui.js')
$contactCss = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-contact-identity.css')

$retiredContactController = Join-Path $theme 'assets/checkout/checkout-contact-identity.js'
Assert-True (-not (Test-Path -LiteralPath $retiredContactController)) 'Retired duplicate checkout-contact-identity.js controller must remain deleted.'

Assert-True ($bootstrap.Contains("Validation/CheckoutTaxReadiness.php")) 'Commerce bootstrap must load tax readiness diagnostics.'
Assert-True ($bootstrap.Contains('DTB_CheckoutTaxReadiness::register()')) 'Commerce bootstrap must register tax readiness diagnostics.'
Assert-True ($taxReadiness.Contains('wc_tax_enabled')) 'Tax readiness must use WooCommerce tax enablement as the authority.'
Assert-True ($taxReadiness.Contains("'country'   => 'US'")) 'Tax readiness must probe the configured US jurisdiction.'
Assert-True ($taxReadiness.Contains("'state'     => 'MN'")) 'Tax readiness must probe the configured Minnesota jurisdiction.'
Assert-True (-not ($taxReadiness -match '6\.875|0\.06875')) 'DTB source must not hard-code the operator-managed Minnesota tax rate.'
Assert-True (-not $fieldPolicy.Contains('woocommerce_register_additional_checkout_field')) 'Duplicate DTB checkout identity fields must remain retired.'

Assert-True ($template.Contains("'dtb-checkout-theme-login-handoff'")) 'Native checkout must enqueue the storefront login handoff guard.'
Assert-True (-not $template.Contains('checkout-contact-identity.js')) 'Native checkout must not load the retired duplicate contact controller.'
Assert-True ($loginHandoff.Contains('/login?returnTo=%2Fcheckout')) 'Checkout login must return through the storefront login route.'
Assert-True ($loginHandoff.Contains('event.preventDefault()')) 'Checkout login handoff must suppress the native My Account navigation.'
Assert-True ($loginHandoff.Contains('event.stopPropagation()')) 'Checkout login handoff must stop delegated navigation from restoring My Account.'
Assert-True ($loginHandoff.Contains('window.location.assign')) 'Checkout login must perform an explicit full-document storefront handoff.'
Assert-True ($loginHandoff.Contains('MutationObserver')) 'Checkout login links must be rebound after Checkout Block rerenders.'

Assert-True ($ui.Contains('function ensureContactProxy()')) 'Consolidated checkout controller must render canonical contact presentation proxies.'
Assert-True ($ui.Contains("key: 'first_name'")) 'Mobile Contact must include first name presentation.'
Assert-True ($ui.Contains("key: 'last_name'")) 'Mobile Contact must include last name presentation.'
Assert-True ($ui.Contains("key: 'phone'")) 'Mobile Contact must include phone presentation.'
Assert-True ($ui.Contains('data-dtb-canonical-contact-key')) 'Contact controls must remain presentation proxies over canonical Woo properties.'
Assert-True ($ui.Contains('setNativeValue')) 'Contact proxies must synchronize into canonical Woo inputs/events.'
Assert-True ($ui.Contains("activeStep === 1 && commerceBusy()")) 'Only Shipping may be blocked by Woo recalculation; Contact progression must remain responsive.'
Assert-True ($ui.Contains("next.addEventListener( 'click'")) 'Primary mobile Continue control must retain a direct click handler.'
Assert-True ($ui.Contains('totals.total_tax')) 'Checkout live summary must render Woo-authoritative tax totals.'
Assert-True ($ui.Contains('totals.total_shipping')) 'Checkout live summary must render Woo-authoritative shipping totals.'
Assert-True ($contactCss.Contains('.dtb-contact-proxy-grid')) 'Contact presentation stylesheet must retain the consolidated proxy field layout.'

Write-Host 'DTB checkout tax/login/contact static smoke checks passed.' -ForegroundColor Green
