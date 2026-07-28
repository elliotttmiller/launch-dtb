Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot

function Read-RepositoryFile {
    param([Parameter(Mandatory = $true)][string]$RelativePath)

    $Path = Join-Path $RepositoryRoot $RelativePath
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required repository file is missing: $RelativePath"
    }

    return Get-Content -LiteralPath $Path -Raw
}

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )

    if (-not $Content.Contains($Needle)) {
        throw "Contract failure: $Description. Missing: $Needle"
    }
}

function Assert-NotContains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )

    if ($Content.Contains($Needle)) {
        throw "Contract failure: $Description. Forbidden: $Needle"
    }
}

$template = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'
$css = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css'
$flowCss = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-flow.css'
$ui = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js'
$boot = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-boot.js'
$express = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-express-entry.js'
$fieldPolicy = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php'
$runtime = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/WooNativeCheckoutRuntime.php'
$provider = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php'
$shipping = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/ExpressCheckoutShippingReadiness.php'
$recovery = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/FailedPaymentRecovery.php'

Assert-Contains $template "'/assets/checkout/checkout.css'" 'Checkout must load the single authoritative stylesheet'
Assert-Contains $template "'dtb-checkout-theme-ui'" 'Checkout must load the bounded presentation controller'
Assert-Contains $template "'dtb-checkout-theme-express-entry'" 'Checkout must load the bounded express handoff controller'
Assert-Contains $template 'wp_add_inline_style(' 'Desktop express ordering must remain attached to the authoritative checkout style handle'
Assert-Contains $template '@media (min-width:1024px)' 'Express checkout ordering must be desktop-only'
Assert-Contains $template '.wp-block-woocommerce-checkout-express-payment-block' 'The canonical WooCommerce Express Checkout block must be targeted'
Assert-Contains $template 'order:-100!important' 'Express Checkout must remain first in the desktop form column'
Assert-Contains $template "'dtb-checkout-theme-flow'" 'Checkout must load the bounded mobile/tablet step-wizard stylesheet'
Assert-Contains $template "'assets/checkout/checkout-flow.css'" 'The step-wizard stylesheet must be the dedicated checkout-flow.css asset'
Assert-NotContains $template 'checkout-refinements.css' 'Stale cascade layers must not be enqueued'
Assert-NotContains $template 'checkout-desktop-redesign.css' 'Desktop styling must be consolidated'
Assert-NotContains $template 'checkout-mobile-redesign.css' 'Mobile styling must be consolidated'
Assert-NotContains $template 'checkout-contact-identity.css' 'Duplicate contact proxy styling must be removed'
Assert-NotContains $template 'checkout-payment-runtime.js' 'Payment iframe mutation runtime must not be loaded'
Assert-NotContains $template 'checkout-payment-failure.js' 'Duplicate payment-error injection must not be loaded'
Assert-NotContains $template 'checkout-login-handoff.js' 'Login handoff must have one owner'

Assert-Contains $css '--dtb-checkout-page-width' 'Checkout design tokens must be centralized'
Assert-Contains $css '@media (min-width: 1024px)' 'Desktop layout must be explicit'
Assert-Contains $css '@media (max-width: 767px)' 'Mobile layout must be explicit'
Assert-Contains $css '.wc-block-components-sidebar-layout' 'Checkout columns must be responsive'
Assert-Contains $css '.wc-block-components-text-input input' 'Canonical WooCommerce fields must be styled'
Assert-Contains $css '.wc-block-components-express-payment__content' 'Express wallet shell must be styled without replacing it'
Assert-Contains $css '.wc-block-components-payment-methods' 'Payment method shell must be styled'
Assert-Contains $css '.wc-block-components-order-summary-item' 'Order summary line items must be styled'
Assert-Contains $css '.wc-block-components-totals-footer-item' 'Grand total hierarchy must be styled'
Assert-Contains $css '.wc-block-components-validation-error' 'Validation feedback must be visible'
Assert-Contains $css '@media (prefers-reduced-motion: reduce)' 'Reduced-motion support must be present'
Assert-Contains $css '@media (forced-colors: active)' 'Forced-colors support must be present'
Assert-NotContains $css 'confidence' 'The removed confidence panel must not return'
Assert-NotContains $css 'dtb-contact-proxy' 'Duplicate contact proxy selectors must not return'
Assert-NotContains $css 'dtb-mobile-checkout-actions' 'The old fixed-overlay mobile navigation class must not return'

Assert-Contains $flowCss 'is-dtb-checkout-step-inactive' 'The step wizard must define the inactive-step visual state'
Assert-Contains $flowCss 'dtb-checkout-wizard-progress' 'The step wizard must render a progress indicator'
Assert-Contains $flowCss '@media (max-width: 1023px)' 'The step wizard must be scoped to tablet and mobile widths'
Assert-Contains $flowCss 'height: 0 !important' 'Inactive checkout steps must stay mounted via zero-height visual hiding, never display:none'
Assert-NotContains $flowCss 'position: fixed' 'The wizard action row must not be a fixed overlay covering payment content'
Assert-NotContains $flowCss 'position:fixed' 'The wizard action row must not be a fixed overlay covering payment content'

Assert-Contains $ui 'commerceSnapshot' 'Presentation must observe WooCommerce state read-only'
Assert-Contains $ui 'classifyPaymentSurface' 'Payment shell classification must remain same-origin and bounded'
Assert-Contains $ui 'focusNewestError' 'Native errors must receive accessible focus management'
Assert-Contains $ui 'rewriteLoginLinks' 'Storefront authentication handoff must remain wired'
Assert-Contains $ui 'aria-busy' 'Checkout busy state must be exposed accessibly'
Assert-Contains $ui 'wizardViewport' 'The below-1024px Contact -> Shipping -> Payment step wizard must be present'
Assert-Contains $ui 'data-dtb-checkout-step' 'The step wizard must mark step ownership on native WooCommerce sections'
Assert-Contains $ui "wizardInactiveClass" 'The step wizard must use a visual (non-display:none) inactive-step class'
Assert-NotContains $ui 'createProxyField' 'Theme must not create duplicate checkout fields'
Assert-NotContains $ui 'setNativeValue' 'Theme must not write canonical customer values through proxy controls'
Assert-NotContains $ui 'inert' 'Theme must not alter provider interactivity'
Assert-NotContains $ui 'frame.style' 'Theme must not mutate provider iframe styles'
Assert-NotContains $ui 'innerHTML =' 'Theme must not inject duplicate form or payment markup via innerHTML'

Assert-Contains $boot 'dtb-native-checkout-ready' 'Mechanical boot reveal must remain isolated'
Assert-Contains $express 'providerSurfaceReady' 'Express handoff must wait for an actual provider surface'
Assert-NotContains $express 'confirmPayment' 'Express handoff must never confirm payment'
Assert-NotContains $express 'createPaymentMethod' 'Express handoff must never tokenize payment data'

Assert-Contains $fieldPolicy 'does not register duplicate first-name' 'Backend field policy must preserve one canonical field model'
Assert-Contains $runtime 'private, no-store' 'Native checkout document must remain non-cacheable'
Assert-Contains $provider 'wc_stripe_upe_params' 'Stripe styling must use the supported Appearance API boundary'
Assert-Contains $provider 'woocommerce_store_api_checkout_order_processed' 'Store API order tagging must remain wired'
Assert-Contains $shipping 'wp_verify_nonce' 'Wallet shipping hardening must verify the official nonce'
Assert-Contains $shipping 'stripe_express_checkout_shipping_rates_missing' 'Missing wallet rates must remain observable'
Assert-Contains $recovery 'checkout-draft' 'Recoverable failed payments must remain retryable without a durable failed order'

Write-Host 'PASS: Checkout UI, responsive layout, desktop express ordering, accessibility, payment authority, wallet shipping, and recovery contracts are intact.'