Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Read-RequiredText {
    param([Parameter(Mandatory = $true)] [string] $Path)

    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required checkout source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$bootstrapPath = Join-Path $commerce 'bootstrap.php'
$uiPath = Join-Path $commerce 'assets/woo-native-checkout-ui.js'
$cssPath = Join-Path $commerce 'assets/woo-native-checkout.css'
$refinementsPath = Join-Path $commerce 'assets/woo-native-checkout-refinements.css'
$performancePath = Join-Path $commerce 'assets/woo-native-checkout-performance.js'
$runtimeIntegrityPath = Join-Path $commerce 'Payment/CheckoutRuntimeIntegrity.php'
$nativeRuntimePath = Join-Path $commerce 'Payment/WooNativeCheckoutRuntime.php'
$officialStripePath = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
$templatePath = Join-Path $commerce 'Templates/WooNativeCheckoutPage.php'

$bootstrap = Read-RequiredText $bootstrapPath
$ui = Read-RequiredText $uiPath
$css = Read-RequiredText $cssPath
$refinements = Read-RequiredText $refinementsPath
$performance = Read-RequiredText $performancePath
$runtimeIntegrity = Read-RequiredText $runtimeIntegrityPath
$nativeRuntime = Read-RequiredText $nativeRuntimePath
$officialStripe = Read-RequiredText $officialStripePath
$template = Read-RequiredText $templatePath

$retiredPaths = @(
    (Join-Path $commerce 'Payment/MobilePaymentSheet.php'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.css')
)

foreach ($retiredPath in $retiredPaths) {
    Assert-True (-not (Test-Path -LiteralPath $retiredPath)) "Retired checkout artifact must remain deleted: $retiredPath"
}

Assert-True (-not $bootstrap.Contains('MobilePaymentSheet.php')) 'dtb-commerce bootstrap must not load the retired mobile payment sheet.'
Assert-True (-not $runtimeIntegrity.Contains('dtb-woo-native-checkout-payment-sheet')) 'Runtime integrity must not retain the retired payment-sheet handle.'
Assert-True (-not $runtimeIntegrity.Contains('dtb-woo-native-checkout-profile-refinements')) 'Runtime integrity must not retain the retired profile-refinement handle.'

foreach ($requiredStep in @("id: 'contact'", "id: 'shipping'", "id: 'payment'")) {
    Assert-True ($ui.Contains($requiredStep)) "Mobile checkout UI is missing required step contract: $requiredStep"
}

Assert-True ($ui.Contains("'Continue to shipping'")) 'Mobile checkout UI must expose the Contact -> Shipping continue action.'
Assert-True ($ui.Contains("'Continue to payment'")) 'Mobile checkout UI must expose the Shipping -> Payment continue action.'
Assert-True ($ui.Contains("const storefrontLoginUrl = '/login?returnTo=%2Fcheckout';")) 'Checkout login must route through the DTB storefront login page with a safe checkout return target.'
Assert-True ($ui.Contains('Step navigation is presentation-only. WooCommerce remains the sole')) 'Mobile step navigation must not become a second checkout validation authority.'
Assert-True (-not $ui.Contains('validateActiveStep()')) 'Mobile step navigation must not block on DOM-discovered validation controls.'
Assert-True (-not $ui.Contains('dtb-payment-sheet')) 'Mobile checkout UI must not restore payment-sheet state.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout presentation must not clone Woo/Stripe controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout presentation must not replace Woo/Stripe controls.'

Assert-True ($css.Contains('.dtb-mobile-checkout-progress')) 'Checkout stylesheet must include the mobile three-step progress UI.'
Assert-True ($css.Contains('.dtb-mobile-checkout-actions')) 'Checkout stylesheet must include mobile non-submit continue actions.'
Assert-True ($css.Contains('.wc-block-components-express-payment__event-buttons')) 'Checkout stylesheet must retain provider-owned Express Checkout framing.'
Assert-True (-not $css.Contains('.dtb-payment-sheet')) 'Checkout stylesheet must not contain retired payment-sheet selectors.'

Assert-True ($refinements.Contains('.wc-block-components-express-payment__content')) 'Checkout refinements must normalize the Express Checkout outer wrapper.'
Assert-True ($refinements.Contains('.wc-block-components-express-payment__event-buttons > li')) 'Checkout refinements must keep wallet list items layout-only.'
Assert-True ($refinements.Contains('.wp-block-woocommerce-checkout-order-summary-block')) 'Checkout refinements must normalize the Woo order-summary shell.'
Assert-True ($refinements.Contains('background: transparent !important')) 'Checkout refinements must flatten redundant same-origin wrapper backgrounds.'
Assert-True ($refinements.Contains('border: 0 !important')) 'Checkout refinements must flatten redundant same-origin wrapper borders.'
Assert-True (-not ($refinements -match 'iframe\s+[.#\[]')) 'Checkout refinements must not target descendants inside provider iframes.'

Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 )")) 'Native checkout must disable React asset ownership on the checkout document.'
Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 )")) 'Native checkout must preserve Woo/WP/Stripe assets from the headless theme stripper.'
Assert-True ($nativeRuntime.Contains("'/Templates/WooNativeCheckoutPage.php'")) 'Native checkout must remain hosted by the canonical dtb-commerce template, not legacy theme checkout assets.'

Assert-True ($performance.Contains("document.body.classList.contains( 'dtb-checkout-step-payment' )")) 'Checkout telemetry must arm mobile provider timeout monitoring from the inline Payment step.'
Assert-True (-not $performance.Contains('dtb-payment-sheet-open')) 'Checkout telemetry must not depend on retired payment-sheet state.'

Assert-True ($officialStripe.Contains("'wc_stripe_upe_params'")) 'Official Stripe integration must continue using the supported gateway appearance filter.'
Assert-True ($officialStripe.Contains("'blocksAppearance'")) 'Official Stripe integration must continue using provider-supported Appearance configuration.'
Assert-True ($officialStripe -match "'theme'\s*=>\s*'stripe'") 'Stripe Appearance theme must match the unified checkout design contract.'

Assert-True ($template.Contains('the_content();')) 'Native checkout template must continue delegating checkout rendering to the assigned Woo Checkout page.'
Assert-True ($template.Contains('dtb-checkout-responsive-runtime-safety')) 'Native checkout template must retain responsive/provider mounting safety invariants.'
Assert-True ($template.Contains('data-dtb-checkout-step="payment"')) 'Provider mounting safety must preserve the inactive mobile Payment surface.'
Assert-True ($template.Contains('dtb-checkout-step-contact')) 'Mobile Contact must retain the responsive ordering rule that keeps Express Checkout before the order summary.'

Write-Host 'DTB checkout presentation static smoke checks passed.' -ForegroundColor Green
