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

$bootstrapPath = Join-Path $commerce 'bootstrap.php'
$performancePath = Join-Path $commerce 'assets/woo-native-checkout-performance.js'
$runtimeIntegrityPath = Join-Path $commerce 'Payment/CheckoutRuntimeIntegrity.php'
$nativeRuntimePath = Join-Path $commerce 'Payment/WooNativeCheckoutRuntime.php'
$officialStripePath = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
$fieldPolicyPath = Join-Path $commerce 'Validation/CheckoutFieldPolicy.php'
$templatePath = Join-Path $theme 'templates/checkout/native-checkout.php'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'
$cssPath = Join-Path $theme 'assets/checkout/checkout.css'
$refinementsPath = Join-Path $theme 'assets/checkout/checkout-refinements.css'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$profilePath = Join-Path $theme 'assets/checkout/checkout-profile.js'

$bootstrap = Read-RequiredText $bootstrapPath
$performance = Read-RequiredText $performancePath
$runtimeIntegrity = Read-RequiredText $runtimeIntegrityPath
$nativeRuntime = Read-RequiredText $nativeRuntimePath
$officialStripe = Read-RequiredText $officialStripePath
$fieldPolicy = Read-RequiredText $fieldPolicyPath
$template = Read-RequiredText $templatePath
$ui = Read-RequiredText $uiPath
$css = Read-RequiredText $cssPath
$refinements = Read-RequiredText $refinementsPath
$flow = Read-RequiredText $flowPath
$profile = Read-RequiredText $profilePath

$retiredPaths = @(
    (Join-Path $commerce 'Payment/MobilePaymentSheet.php'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.css'),
    (Join-Path $commerce 'assets/woo-native-checkout.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-refinements.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-ui.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-steps.js'),
    (Join-Path $commerce 'Templates/WooNativeCheckoutPage.php'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.js'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.css')
)
foreach ($retiredPath in $retiredPaths) {
    Assert-True (-not (Test-Path -LiteralPath $retiredPath)) "Retired/competing checkout artifact must remain deleted: $retiredPath"
}

Assert-True (-not $bootstrap.Contains('MobilePaymentSheet.php')) 'dtb-commerce bootstrap must not load a retired payment sheet.'
Assert-True (-not $officialStripe.Contains('enqueue_checkout_assets')) 'Official Stripe integration must not own checkout presentation assets.'
Assert-True (-not $fieldPolicy.Contains('wp_enqueue_style')) 'Checkout field policy must not own presentation CSS.'
Assert-True ($nativeRuntime.Contains("locate_template( 'templates/checkout/native-checkout.php'")) 'Native checkout runtime must delegate document presentation to the active theme.'
Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 )")) 'Native checkout must disable React asset ownership on the checkout document.'
Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 )")) 'Native checkout must preserve Woo/WP/Stripe assets from the headless theme stripper.'

Assert-True ($template.Contains("'dtb-checkout-theme'")) 'Theme checkout template must enqueue the authoritative base checkout stylesheet.'
Assert-True ($template.Contains("'dtb-checkout-theme-refinements'")) 'Theme checkout template must enqueue same-origin wrapper refinements.'
Assert-True ($template.Contains("'dtb-checkout-theme-flow'")) 'Theme checkout template must enqueue responsive inline checkout flow styles.'
Assert-True ($template.Contains("'dtb-checkout-theme-ui'")) 'Theme checkout template must enqueue the presentation controller.'
Assert-True (-not $template.Contains('checkout-payment-sheet')) 'Theme checkout template must not enqueue a mobile payment sheet.'
Assert-True ($template.Contains('the_content();')) 'Theme checkout template must delegate checkout rendering to the assigned Woo Checkout page.'

foreach ($requiredStep in @("id: 'contact'", "id: 'shipping'", "id: 'payment'")) {
    Assert-True ($ui.Contains($requiredStep)) "Mobile checkout UI is missing required step contract: $requiredStep"
}
Assert-True ($ui.Contains("'Continue to shipping'")) 'Mobile checkout UI must expose Contact -> Shipping navigation.'
Assert-True ($ui.Contains("'Continue to payment'")) 'Mobile checkout UI must expose Shipping -> Payment navigation.'
Assert-True ($ui.Contains("const storefrontLoginUrl = '/login?returnTo=%2Fcheckout';")) 'Checkout login must route through the storefront login with a safe checkout return target.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Theme checkout UI must not implement payment-sheet state.'
Assert-True (-not $ui.Contains('openPaymentSheet')) 'Theme checkout UI must not open a custom payment sheet.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout presentation must not clone Woo/Stripe controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout presentation must not replace Woo/Stripe controls.'
Assert-True (-not $ui.Contains('appendChild( payment')) 'Checkout presentation must not reparent payment controls.'
Assert-True ($ui.Contains('is-dtb-single-gateway')) 'Single-gateway presentation marker must be applied by the active theme controller.'
Assert-True ($ui.Contains('syncContactIdentityFields')) 'Theme controller must preserve contact-to-canonical-address synchronization.'

Assert-True ($refinements.Contains('.wc-block-components-express-payment__content')) 'Theme refinements must normalize the Express Checkout outer wrapper.'
Assert-True ($refinements.Contains('.wc-block-components-express-payment__event-buttons > li')) 'Theme refinements must keep wallet list items layout-only.'
Assert-True ($refinements.Contains('.wp-block-woocommerce-checkout-order-summary-block')) 'Theme refinements must normalize the Woo order-summary shell.'
Assert-True ($refinements.Contains('.dtb-native-identity-field')) 'Theme refinements must hide synchronized native identity duplicates only after classification.'
Assert-True (-not ($refinements -match 'iframe\s+[.#\[]')) 'Theme refinements must not target descendants inside provider iframes.'

Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Mobile flow must keep the inactive provider payment surface mounted/measurable.'
Assert-True ($flow.Contains('.dtb-mobile-checkout-progress')) 'Theme flow stylesheet must include the three-step progress UI.'
Assert-True ($flow.Contains('.dtb-mobile-checkout-actions')) 'Theme flow stylesheet must include non-submit mobile navigation controls.'
Assert-True (-not $flow.Contains('dtb-payment-sheet')) 'Theme flow stylesheet must not restore payment-sheet selectors.'

Assert-True ($runtimeIntegrity.Contains("'dtb-checkout-theme-ui'")) 'Runtime integrity must recognize the theme-owned checkout UI handle.'
Assert-True (-not $runtimeIntegrity.Contains('dtb-woo-native-checkout-ui')) 'Runtime integrity must not retain the retired MU presentation handle.'
Assert-True ($performance.Contains("document.body.classList.contains( 'dtb-checkout-step-payment' )")) 'Checkout telemetry must arm provider timeout monitoring from the inline Payment step.'
Assert-True (-not $performance.Contains('dtb-payment-sheet-open')) 'Checkout telemetry must not depend on retired payment-sheet state.'

Assert-True ($officialStripe.Contains("'wc_stripe_upe_params'")) 'Official Stripe integration must continue using the supported gateway Appearance filter.'
Assert-True ($officialStripe.Contains("'blocksAppearance'")) 'Official Stripe integration must continue using provider-supported Appearance configuration.'
Assert-True ($officialStripe -match "'theme'\s*=>\s*'stripe'") 'Stripe Appearance theme must match the unified checkout design contract.'

Assert-True ($css.Contains('.wc-block-components-express-payment')) 'Base theme checkout stylesheet must retain Express Checkout presentation support.'
Assert-True ($profile.Length -gt 0) 'Signed-in checkout profile refinement asset must remain present.'

Write-Host 'DTB checkout presentation static smoke checks passed.' -ForegroundColor Green
