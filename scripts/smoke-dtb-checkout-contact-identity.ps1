Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

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

$template = Read-RequiredText (Join-Path $theme 'templates/checkout/native-checkout.php')
$bridge = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-contact-identity.js')
$bridgeCss = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-contact-identity.css')
$fieldPolicy = Read-RequiredText (Join-Path $commerce 'Validation/CheckoutFieldPolicy.php')

Assert-True ($template.Contains("'dtb-checkout-theme-contact-identity'")) 'Native checkout must load the contact identity presentation bridge.'
Assert-True ($template.Contains("[ 'dtb-checkout-theme-ui', 'wp-data', 'wc-blocks-data-store' ]")) 'Contact identity bridge must load after checkout UI and Woo block data stores.'

foreach ($field in @('first_name', 'last_name', 'phone')) {
    Assert-True ($bridge.Contains("key: '$field'")) "Mobile contact proxy is missing canonical field: $field"
}
Assert-True ($bridge.Contains('data-dtb-canonical-contact-key')) 'Contact controls must be presentation proxies over canonical Woo properties.'
Assert-True ($bridge.Contains('setNativeInputValue')) 'Contact proxy changes must propagate through native Woo inputs/events.'
Assert-True ($bridge.Contains('getCustomerData')) 'Contact proxies must hydrate from authoritative Woo customer state.'
Assert-True ($bridge.Contains('dtb-native-identity-field')) 'Canonical native duplicate controls must remain mounted but may be visually classified.'
Assert-True ($bridge.Contains("document.body.classList.contains( 'dtb-checkout-step-contact' )")) 'Contact CTA hardening must be scoped to the Contact step.'
Assert-True ($bridge.Contains('next.disabled = false')) 'Contact progression must not remain disabled by unrelated background Woo calculation state.'
Assert-True (-not $bridge.Contains('woocommerce_register_additional_checkout_field')) 'Theme bridge must never register business fields.'
Assert-True (-not $bridge.Contains('paymentSheet')) 'Contact bridge must not introduce payment-sheet state.'
Assert-True (-not $bridge.Contains('cloneNode(')) 'Contact bridge must not clone Woo/Stripe controls.'
Assert-True (-not $bridge.Contains('replaceWith(')) 'Contact bridge must not replace Woo/Stripe controls.'

Assert-True ($bridgeCss.Contains('.dtb-contact-proxy-grid')) 'Contact identity stylesheet must style the restored mobile field group.'
Assert-True ($bridgeCss.Contains('.dtb-contact-proxy-field')) 'Contact identity stylesheet must style individual canonical proxy controls.'
Assert-True (-not ($bridgeCss -match 'iframe\s+[.#\[]')) 'Contact identity styling must never target provider iframe descendants.'

Assert-True (-not $fieldPolicy.Contains('woocommerce_register_additional_checkout_field')) 'Backend must not restore duplicate DTB required identity fields.'
Assert-True (-not $fieldPolicy.Contains('dtb-checkout/contact-first-name')) 'Backend must not restore retired duplicate first-name authority.'
Assert-True (-not $fieldPolicy.Contains('dtb-checkout/contact-last-name')) 'Backend must not restore retired duplicate last-name authority.'

Write-Host 'DTB mobile contact identity static smoke checks passed.' -ForegroundColor Green
