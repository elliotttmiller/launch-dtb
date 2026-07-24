Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$orderPlatform = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw $Message }
}

function Read-RequiredText {
    param([string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$bootstrapPath = Join-Path $orderPlatform 'bootstrap.php'
$integrityPath = Join-Path $orderPlatform 'Rest/CheckoutConfirmationIntegrity.php'
$returnContextPath = Join-Path $commerce 'Payment/StorefrontReturnContext.php'

$bootstrap = Read-RequiredText $bootstrapPath
$integrity = Read-RequiredText $integrityPath
$returnContext = Read-RequiredText $returnContextPath

Assert-True ($bootstrap.Contains("/Rest/CheckoutConfirmationIntegrity.php")) 'Order platform must load checkout confirmation integrity.'
Assert-True ($integrity.Contains("'payment_confirmed'")) 'Customer order responses must expose explicit payment confirmation state.'
Assert-True ($integrity.Contains("'order_confirmed'")) 'Customer order responses must expose explicit order confirmation state.'
Assert-True ($integrity.Contains("'is_checkout_draft'")) 'Customer order responses must expose checkout-draft state.'
Assert-True ($integrity.Contains("$data['payment_required'] = true")) 'Unconfirmed orders must fail closed as payment-required.'
Assert-True ($integrity.Contains('dtb_checkout_handoff_has_captured_payment')) 'Confirmation must use authoritative captured-payment evidence.'
Assert-True ($returnContext.Contains('is_confirmable_order')) 'Storefront success redirect must have an explicit confirmation gate.'
Assert-True ($returnContext.Contains('checkout_success_redirect_blocked_unverified_order')) 'Blocked false-success redirects must be observable.'
Assert-True ($returnContext.Contains('dtb_checkout_handoff_has_captured_payment')) 'Success redirect must require captured-payment evidence for paid orders.'
Assert-True (-not $returnContext.Contains("'checkout_complete' => '1'\n\t\t\t],\n\t\t\t$url\n\t\t);\n\t}")) 'Success routing must not bypass the confirmation guard.'

Write-Host 'DTB checkout confirmation integrity static smoke checks passed.' -ForegroundColor Green
