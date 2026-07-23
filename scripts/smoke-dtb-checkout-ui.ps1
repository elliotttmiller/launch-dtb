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
$performancePath = Join-Path $commerce 'assets/woo-native-checkout-performance.js'
$runtimeIntegrityPath = Join-Path $commerce 'Payment/CheckoutRuntimeIntegrity.php'
$officialStripePath = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
$templatePath = Join-Path $commerce 'Templates/WooNativeCheckoutPage.php'

$bootstrap = Read-RequiredText $bootstrapPath
$ui = Read-RequiredText $uiPath
$css = Read-RequiredText $cssPath
$performance = Read-RequiredText $performancePath
$runtimeIntegrity = Read-RequiredText $runtimeIntegrityPath
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
    Assert-True $ui.Contains($requiredStep) "Mobile checkout UI is missing required step contract: $requiredStep"
}

Assert-True $ui.Contains("'Continue to shipping'") 'Mobile checkout UI must expose the Contact -> Shipping continue action.'
Assert-True $ui.Contains("'Continue to payment'") 'Mobile checkout UI must expose the Shipping -> Payment continue action.'
Assert-True (-not $ui.Contains('dtb-payment-sheet')) 'Mobile checkout UI must not restore payment-sheet state.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout presentation must not clone Woo/Stripe controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout presentation must not replace Woo/Stripe controls.'

Assert-True $css.Contains('.dtb-mobile-checkout-progress') 'Checkout stylesheet must include the mobile three-step progress UI.'
Assert-True $css.Contains('.dtb-mobile-checkout-actions') 'Checkout stylesheet must include mobile non-submit continue actions.'
Assert-True $css.Contains('.wc-block-components-express-payment__event-buttons') 'Checkout stylesheet must retain provider-owned Express Checkout framing.'
Assert-True (-not $css.Contains('.dtb-payment-sheet')) 'Checkout stylesheet must not contain retired payment-sheet selectors.'

Assert-True $performance.Contains("document.body.classList.contains( 'dtb-checkout-step-payment' )") 'Checkout telemetry must arm mobile provider timeout monitoring from the inline Payment step.'
Assert-True (-not $performance.Contains('dtb-payment-sheet-open')) 'Checkout telemetry must not depend on retired payment-sheet state.'

Assert-True $officialStripe.Contains("'wc_stripe_upe_params'") 'Official Stripe integration must continue using the supported gateway appearance filter.'
Assert-True $officialStripe.Contains("'blocksAppearance'") 'Official Stripe integration must continue using provider-supported Appearance configuration.'
Assert-True $officialStripe.Contains("'theme'     => 'stripe'") 'Stripe Appearance theme must match the unified checkout design contract.'

Assert-True $template.Contains('the_content();') 'Native checkout template must continue delegating checkout rendering to the assigned Woo Checkout page.'
Assert-True $template.Contains('dtb-checkout-responsive-runtime-safety') 'Native checkout template must retain responsive/provider mounting safety invariants.'
Assert-True $template.Contains('data-dtb-checkout-step="payment"') 'Provider mounting safety must preserve the inactive mobile Payment surface.'

Write-Host 'DTB checkout presentation static smoke checks passed.' -ForegroundColor Green
