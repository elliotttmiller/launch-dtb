Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'
$templatePath = Join-Path $theme 'templates/checkout/native-checkout.php'
$runtimeContextPath = Join-Path $theme 'assets/checkout/checkout-runtime-context.css'
$paymentCssPath = Join-Path $theme 'assets/checkout/checkout-payment-interaction.css'
$paymentRuntimePath = Join-Path $theme 'assets/checkout/checkout-payment-runtime.js'
$paymentFailureCssPath = Join-Path $theme 'assets/checkout/checkout-payment-failure.css'
$paymentFailureRuntimePath = Join-Path $theme 'assets/checkout/checkout-payment-failure.js'
$failedPaymentRecoveryPath = Join-Path $commerce 'Payment/FailedPaymentRecovery.php'
$commerceBootstrapPath = Join-Path $commerce 'bootstrap.php'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

$requiredPaths = @(
    $templatePath,
    $runtimeContextPath,
    $paymentCssPath,
    $paymentRuntimePath,
    $paymentFailureCssPath,
    $paymentFailureRuntimePath,
    $failedPaymentRecoveryPath,
    $commerceBootstrapPath,
    $flowPath,
    $uiPath
)

foreach ($path in $requiredPaths) {
    Assert-True (Test-Path -LiteralPath $path -PathType Leaf) "Required checkout payment source file is missing: $path"
}

$template = Get-Content -LiteralPath $templatePath -Raw
$runtimeContext = Get-Content -LiteralPath $runtimeContextPath -Raw
$paymentCss = Get-Content -LiteralPath $paymentCssPath -Raw
$paymentRuntime = Get-Content -LiteralPath $paymentRuntimePath -Raw
$paymentFailureCss = Get-Content -LiteralPath $paymentFailureCssPath -Raw
$paymentFailureRuntime = Get-Content -LiteralPath $paymentFailureRuntimePath -Raw
$failedPaymentRecovery = Get-Content -LiteralPath $failedPaymentRecoveryPath -Raw
$commerceBootstrap = Get-Content -LiteralPath $commerceBootstrapPath -Raw
$flow = Get-Content -LiteralPath $flowPath -Raw
$ui = Get-Content -LiteralPath $uiPath -Raw

Assert-True ($template.Contains("'dtb-checkout-theme-payment-interaction'")) 'Checkout template must load the final payment interaction stylesheet.'
Assert-True ($template.Contains("'dtb-checkout-theme-payment-runtime'")) 'Checkout template must load the narrow payment runtime after the main UI controller.'
Assert-True ($template.Contains("'dtb-checkout-theme-payment-failure'")) 'Checkout template must load the failed-payment recovery presentation.'
Assert-True ($runtimeContext.Contains('.wc-block-components-payment-method-content')) 'Payment runtime context must normalize the Woo payment content wrapper.'
Assert-True ($paymentCss.Contains('.wc-stripe-upe-element')) 'Final payment layer must preserve the official Stripe UPE mount.'
Assert-True ($paymentCss.Contains('pointer-events: auto !important')) 'Provider payment surfaces must remain interactive.'
Assert-True ($paymentCss.Contains('overflow: visible !important')) 'Provider payment surfaces must not be clipped by DTB wrappers.'
Assert-True ($paymentCss.Contains('body.dtb-checkout-step-payment.dtb-official-stripe-checkout .dtb-mobile-checkout-actions')) 'DTB fixed navigation must be removed from the active Payment step.'
Assert-True ($paymentCss.Contains('is-dtb-single-gateway')) 'Single official gateway shell must be normalized without replacing Stripe payment methods.'
Assert-True ($paymentRuntime.Contains('classifySingleGateway')) 'Payment runtime must classify the redundant Woo single-gateway shell.'
Assert-True ($paymentRuntime.Contains("actionBar.hidden = true")) 'Payment runtime must mechanically remove the fixed DTB navigation overlay on Payment.'
Assert-True ($paymentRuntime.Contains("paymentRoot.removeAttribute( 'inert' )")) 'Payment runtime must remove accidental same-origin inert state from the active provider mount.'
Assert-True ($paymentFailureCss.Contains('.dtb-checkout-payment-recovery')) 'Failed-payment recovery must have a dedicated accessible notice style.'
Assert-True ($paymentFailureRuntime.Contains("Payment wasn't approved")) 'Failed-payment runtime must present the retryable payment message.'
Assert-True ($paymentFailureRuntime.Contains('No order was placed')) 'Failed-payment runtime must explain that checkout was not committed.'
Assert-True ($paymentFailureRuntime.Contains('MutationObserver')) 'Failed-payment runtime must observe Woo notices without intercepting submission.'
Assert-True (-not $paymentFailureRuntime.Contains('preventDefault(')) 'Failed-payment runtime must not intercept Woo checkout submission.'
Assert-True (-not $paymentFailureRuntime.Contains('contentWindow')) 'Failed-payment runtime must not inspect provider iframe contents.'
Assert-True ($commerceBootstrap.Contains("'/Payment/FailedPaymentRecovery.php'")) 'DTB Commerce bootstrap must load failed-payment recovery.'
Assert-True ($failedPaymentRecovery.Contains("woocommerce_order_status_failed")) 'Backend recovery must observe Woo failed payment status.'
Assert-True ($failedPaymentRecovery.Contains("set_status( self::CHECKOUT_DRAFT )")) 'Backend recovery must restore retryable attempts to checkout-draft.'
Assert-True ($failedPaymentRecovery.Contains("dtb_checkout_handoff_has_captured_payment")) 'Backend recovery must reject captured-payment orders.'
Assert-True ($failedPaymentRecovery.Contains("has_irreversible_downstream_state")) 'Backend recovery must reject orders with downstream processing state.'
Assert-True (-not ($paymentCss -match 'iframe\s+[.#\[]')) 'DTB payment CSS must never style descendants inside provider iframes.'
Assert-True (-not $paymentRuntime.Contains('contentWindow')) 'Payment runtime must never inspect or mutate provider iframe contents.'
Assert-True (-not $paymentRuntime.Contains('postMessage')) 'Payment runtime must not synthesize provider payment interactions.'
Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Inactive Payment must remain mounted for provider initialization.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout UI must never clone payment controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout UI must never replace payment controls.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Checkout UI must not restore the retired custom payment sheet.'
Assert-True ($ui.Contains("id: 'payment'")) 'Progressive checkout must retain one Payment step.'

Write-Host 'DTB checkout payment interaction static smoke checks passed.' -ForegroundColor Green
