Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot

function Repository-Path {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    return Join-Path $RepositoryRoot $RelativePath
}

function Read-RepositoryFile {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    $Path = Repository-Path $RelativePath
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required repository file is missing: $RelativePath"
    }
    return Get-Content -LiteralPath $Path -Raw
}

function Assert-Contains {
    param([string]$Content, [string]$Needle, [string]$Description)
    if (-not $Content.Contains($Needle)) {
        throw "Contract failure: $Description. Missing: $Needle"
    }
}

function Assert-NotContains {
    param([string]$Content, [string]$Needle, [string]$Description)
    if ($Content.Contains($Needle)) {
        throw "Contract failure: $Description. Forbidden: $Needle"
    }
}

function Assert-PathAbsent {
    param([string]$RelativePath, [string]$Description)
    if (Test-Path -LiteralPath (Repository-Path $RelativePath)) {
        throw "Contract failure: $Description. Obsolete path remains: $RelativePath"
    }
}

$template = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'
$provider = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/PaymentPluginsStripeNativeCheckout.php'
$runtime = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/WooNativeCheckoutRuntime.php'
$runtimeIntegrity = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutRuntimeIntegrity.php'
$performance = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutPerformance.php'
$identityIsolation = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/StorefrontCommerceIdentityIsolation.php'
$identityBridge = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/NativeCheckoutIdentityBridge.php'
$identityContinuity = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/CheckoutSessionContinuityGuard.php'
$authRoutes = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthRoutes.php'

@(
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css',
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-flow.css',
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-boot.js',
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js',
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-express-entry.js',
    'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/applepay.php'
) | ForEach-Object {
    Assert-PathAbsent $_ 'Legacy DTB checkout presentation assets must stay removed'
}

Assert-Contains $template 'wp_head();' 'The neutral document must load WooCommerce/provider assets'
Assert-Contains $template 'the_content();' 'The neutral document must render the Checkout Block'
Assert-Contains $template 'wp_footer();' 'The neutral document must print footer scripts'
Assert-NotContains $template 'wp_enqueue_style' 'The checkout shell must not enqueue DTB styles'
Assert-NotContains $template 'wp_add_inline_style' 'The checkout shell must not inject style overrides'
Assert-NotContains $template 'wp_enqueue_script' 'The checkout shell must not enqueue presentation controllers'
Assert-NotContains $template '<style' 'The checkout shell must not contain inline CSS'
Assert-NotContains $template '<script' 'The checkout shell must not contain inline presentation JavaScript'
Assert-NotContains $template 'dtb-checkout-' 'Legacy checkout presentation classes must not return'

Assert-Contains $runtime 'private, no-store' 'Native checkout must remain non-cacheable'
Assert-Contains $provider 'woocommerce_store_api_checkout_order_processed' 'Store API order tagging must remain wired'
Assert-Contains $provider 'payment_plugins_stripe' 'Captured-payment metadata must identify the provider'
Assert-NotContains $provider 'wc_stripe_get_element_options' 'Neutral checkout must not inject Stripe Elements appearance overrides'
Assert-NotContains $provider "add_filter( 'body_class'" 'Provider code must not add presentation-only body classes'
Assert-NotContains $runtimeIntegrity 'dtb-checkout-theme-ui' 'Runtime integrity must not retain removed presentation handles'
Assert-NotContains $performance "[ 'dtb-checkout-theme-ui' ]" 'Telemetry must not depend on a removed presentation controller'

Assert-Contains $identityIsolation 'dtb_storefront_commerce_privileged_native_conflict( true )' 'Privileged commerce requests must mark identity isolation'
Assert-Contains $identityBridge 'dtb_storefront_commerce_privileged_native_conflict()' 'Native checkout must honor privileged isolation'
Assert-Contains $identityContinuity 'dtb_storefront_commerce_privileged_native_conflict()' 'Checkout convergence must honor privileged isolation'
Assert-Contains $authRoutes 'dtb_storefront_commerce_privileged_native_conflict()' 'The REST JWT bridge must honor privileged isolation'

Write-Host 'PASS: Neutral WooCommerce checkout baseline, provider authority, and identity isolation contracts are intact.'
