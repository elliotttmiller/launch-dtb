Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$fieldPolicyPath = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php'
$uiPath = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js'
$officialStripePath = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

function Read-RequiredText {
    param([Parameter(Mandatory = $true)] [string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$fieldPolicy = Read-RequiredText $fieldPolicyPath
$ui = Read-RequiredText $uiPath
$officialStripe = Read-RequiredText $officialStripePath

# WooCommerce canonical customer/address fields are the only checkout identity authority.
Assert-True (-not $fieldPolicy.Contains('woocommerce_register_additional_checkout_field')) 'Do not restore duplicate DTB first/last/phone Additional Checkout Fields; express wallets must validate against canonical Woo customer/address state only.'
Assert-True (-not $fieldPolicy.Contains('woocommerce_store_api_checkout_update_order_meta')) 'Checkout field policy must not overwrite canonical wallet/customer address values from legacy DTB duplicate fields.'
Assert-True (-not $fieldPolicy.Contains('FIELD_FIRST_NAME')) 'Legacy DTB duplicate first-name checkout-field registration must remain retired.'
Assert-True (-not $fieldPolicy.Contains('FIELD_LAST_NAME')) 'Legacy DTB duplicate last-name checkout-field registration must remain retired.'
Assert-True (-not $fieldPolicy.Contains('FIELD_PHONE')) 'Legacy DTB duplicate phone checkout-field registration must remain retired.'
Assert-True ($fieldPolicy.Contains('option_woocommerce_checkout_phone_field')) 'Woo canonical phone policy must remain configured through WooCommerce rather than a duplicate DTB field.'

# The theme may contain temporary compatibility no-ops for previously rendered legacy
# fields, but it must never create another commerce authority or provider surface.
Assert-True (-not $ui.Contains('woocommerce_register_additional_checkout_field')) 'Theme presentation must never register checkout business fields.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Theme checkout must not clone wallet/payment controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Theme checkout must not replace wallet/payment controls.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Retired mobile payment-sheet state must remain absent.'

# Official Stripe remains the only wallet/payment authority and exposes its deployed
# extension version through the existing readiness contract for release verification.
Assert-True ($officialStripe.Contains("defined( 'WC_STRIPE_VERSION' )")) 'Checkout capabilities must expose the deployed official Stripe extension version for address-compatibility verification.'
Assert-True ($officialStripe.Contains("'wc_stripe_upe_params'")) 'Official Stripe integration must retain the supported gateway configuration boundary.'

Write-Host 'DTB Express Checkout canonical-address static smoke checks passed.' -ForegroundColor Green
