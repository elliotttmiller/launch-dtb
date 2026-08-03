<?php
/**
 * Admin-only storefront boot diagnostics.
 *
 * This file is copied into the production dist root. It inspects the deployed
 * static shell and lets the current browser verify every boot asset without
 * loading the React application itself.
 */

declare(strict_types=1);

$wp_load = __DIR__ . '/wp/wp-load.php';
if ( ! is_file( $wp_load ) ) {
	http_response_code( 503 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	echo "WordPress bootstrap not found at /wp/wp-load.php.\n";
	exit;
}

require_once $wp_load;

if ( ! is_user_logged_in() ) {
	auth_redirect();
}

if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'dtb_manage_system' ) ) {
	status_header( 403 );
	nocache_headers();
	header( 'Content-Type: text/plain; charset=utf-8' );
	echo "Administrator access is required.\n";
	exit;
}

setcookie(
	'dtb_frontend_debug_authorized',
	'1',
	[
		'expires'  => time() + ( 30 * MINUTE_IN_SECONDS ),
		'path'     => '/',
		'secure'   => is_ssl(),
		'httponly' => false,
		'samesite' => 'Lax',
	]
);

nocache_headers();
header( 'Content-Type: text/html; charset=utf-8' );
header( 'X-Robots-Tag: noindex, nofollow, noarchive', true );
header( "Content-Security-Policy: default-src 'none'; script-src 'nonce-dtb-mobile-debug'; style-src 'nonce-dtb-mobile-debug'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'" );

$index_path = __DIR__ . '/index.html';
$index_html = is_file( $index_path ) ? (string) file_get_contents( $index_path ) : '';
$assets     = [];

if ( '' !== $index_html ) {
	if ( preg_match_all( '/<(?:script|link)\\b[^>]+(?:src|href)=["\']([^"\']+)["\']/i', $index_html, $matches ) ) {
		foreach ( $matches[1] as $asset ) {
			$decoded_asset = html_entity_decode( $asset, ENT_QUOTES );
			$asset_parts   = wp_parse_url( $decoded_asset );
			if ( false === $asset_parts || isset( $asset_parts['scheme'] ) || isset( $asset_parts['host'] ) || str_starts_with( $decoded_asset, '//' ) ) {
				continue;
			}

			$path = (string) ( $asset_parts['path'] ?? '' );
			if ( '' !== $path && str_starts_with( $path, '/' ) ) {
				$assets[] = $path;
			}
		}
	}
}

$asset_manifest_path = __DIR__ . '/asset-manifest.json';
if ( is_file( $asset_manifest_path ) ) {
	$asset_manifest = json_decode( (string) file_get_contents( $asset_manifest_path ), true );
	foreach ( (array) ( $asset_manifest['files'] ?? [] ) as $manifest_asset ) {
		$manifest_path = (string) wp_parse_url( (string) $manifest_asset, PHP_URL_PATH );
		if ( preg_match( '/\\.(?:js|css)$/i', $manifest_path ) ) {
			$assets[] = $manifest_path;
		}
	}
}

$assets = array_values( array_unique( $assets ) );
$server_checks = [
	[ 'name' => 'index.html', 'ok' => is_file( $index_path ), 'detail' => is_file( $index_path ) ? number_format( (int) filesize( $index_path ) ) . ' bytes' : 'missing' ],
	[ 'name' => 'asset-manifest.json', 'ok' => is_file( $asset_manifest_path ), 'detail' => is_file( $asset_manifest_path ) ? 'present' : 'missing' ],
	[ 'name' => 'site.webmanifest', 'ok' => is_file( __DIR__ . '/site.webmanifest' ), 'detail' => is_file( __DIR__ . '/site.webmanifest' ) ? 'present' : 'missing' ],
	[ 'name' => 'boot assets discovered', 'ok' => count( $assets ) > 0, 'detail' => count( $assets ) . ' same-origin assets' ],
];

foreach ( $assets as $asset ) {
	$file = __DIR__ . '/' . ltrim( $asset, '/' );
	$server_checks[] = [
		'name'   => $asset,
		'ok'     => is_file( $file ),
		'detail' => is_file( $file ) ? number_format( (int) filesize( $file ) ) . ' bytes' : 'missing on disk',
	];
}

$payload = wp_json_encode(
	[
		'generatedAt'  => gmdate( DATE_ATOM ),
		'assets'       => $assets,
		'serverChecks' => $server_checks,
	],
	JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
	<title>DTB Mobile Boot Diagnostics</title>
	<style nonce="dtb-mobile-debug">
		:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,sans-serif;background:#f4f6f8;color:#17202a}body{margin:0;padding:20px}.shell{max-width:920px;margin:auto}h1{font-size:24px;margin:0 0 8px}p{line-height:1.5}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}button,a.button{border:0;border-radius:6px;background:#17202a;color:#fff;padding:12px 16px;font:600 15px/1 inherit;text-decoration:none}button:disabled{opacity:.55}.summary{font-weight:700}.grid{display:grid;gap:8px}.row{display:grid;grid-template-columns:26px minmax(140px,1fr) minmax(0,2fr);gap:8px;align-items:start;padding:10px;background:#fff;border:1px solid #dfe4e8;border-radius:6px}.ok{color:#08783e}.fail{color:#b42318}.pending{color:#667085}code,pre{font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}pre{white-space:pre-wrap;background:#111827;color:#e5e7eb;padding:14px;border-radius:6px;max-height:45vh;overflow:auto}@media(max-width:560px){body{padding:14px}.row{grid-template-columns:24px 1fr}.row code{grid-column:2}}
	</style>
</head>
<body>
<main class="shell">
	<h1>DTB Mobile Boot Diagnostics</h1>
	<p>This admin-only page tests the deployed storefront shell from this device. It does not record form values, cookies, account data, or payment data.</p>
	<div class="actions">
		<button id="run" type="button">Run diagnostics</button>
		<a class="button" href="/?dtb_frontend_debug=1">Open storefront debug mode</a>
	</div>
	<p id="summary" class="summary">Ready.</p>
	<div id="results" class="grid"></div>
	<h2>Report</h2>
	<pre id="report">Run diagnostics to generate a copyable report.</pre>
</main>
<script nonce="dtb-mobile-debug">
(function(){
	'use strict';
	var seed=<?php echo $payload ?: '{}'; ?>;
	var runButton=document.getElementById('run');
	var results=document.getElementById('results');
	var summary=document.getElementById('summary');
	var report=document.getElementById('report');
	try{sessionStorage.setItem('dtb:frontend-debug-authorized','1');}catch(error){}

	function addRow(name,ok,detail){
		var row=document.createElement('div');
		row.className='row';
		var icon=document.createElement('strong');
		icon.className=ok===null?'pending':(ok?'ok':'fail');
		icon.textContent=ok===null?'...':(ok?'PASS':'FAIL');
		var label=document.createElement('span');label.textContent=name;
		var value=document.createElement('code');value.textContent=detail;
		row.append(icon,label,value);results.appendChild(row);
	}

	async function inspectAsset(path){
		var started=performance.now();
		try{
			var response=await fetch(path+(path.indexOf('?')===-1?'?':'&')+'dtb_diag='+Date.now(),{cache:'no-store',credentials:'same-origin'});
			var type=response.headers.get('content-type')||'';
			var text=await response.text();
			var expected=/\\.css(?:$|\\?)/i.test(path)?'text/css':(/\\.js(?:$|\\?)/i.test(path)?'javascript':'');
			var html=/^\\s*<!doctype html|^\\s*<html/i.test(text);
			var ok=response.ok&&!html&&(!expected||type.toLowerCase().indexOf(expected)!==-1);
			return {name:path,ok:ok,status:response.status,type:type,bytes:text.length,ms:Math.round(performance.now()-started),htmlInsteadOfAsset:html,cacheControl:response.headers.get('cache-control')||''};
		}catch(error){return {name:path,ok:false,error:String(error&&error.message||error),ms:Math.round(performance.now()-started)};}
	}

	async function run(){
		runButton.disabled=true;results.textContent='';summary.textContent='Running...';
		var checks=[];
		(seed.serverChecks||[]).forEach(function(item){checks.push(item);addRow('Server: '+item.name,item.ok,item.detail);});
		var browser={
			generatedAt:seed.generatedAt,
			runAt:new Date().toISOString(),
			viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio||1},
			platform:navigator.platform||'unknown',
			userAgent:navigator.userAgent,
			online:navigator.onLine,
			cookiesEnabled:navigator.cookieEnabled,
			serviceWorker:'serviceWorker' in navigator,
			cacheStorage:'caches' in window,
			moduleScript:'noModule' in document.createElement('script'),
			storage:null
		};
		try{sessionStorage.setItem('dtb:diag','1');sessionStorage.removeItem('dtb:diag');browser.storage=true;}catch(error){browser.storage=false;}
		addRow('Browser: JavaScript execution',true,'Diagnostic script executed');
		addRow('Browser: module scripts',browser.moduleScript,browser.moduleScript?'supported':'not supported');
		addRow('Browser: session storage',browser.storage,browser.storage?'writable':'blocked');
		var assetResults=await Promise.all((seed.assets||[]).map(inspectAsset));
		assetResults.forEach(function(item){addRow('Network: '+item.name,item.ok,item.error||('HTTP '+item.status+'; '+item.type+'; '+item.bytes+' bytes; '+item.ms+' ms'+(item.htmlInsteadOfAsset?'; HTML returned for asset':'')));});
		var failures=checks.filter(function(x){return !x.ok;}).length+assetResults.filter(function(x){return !x.ok;}).length+(browser.moduleScript?0:1)+(browser.storage?0:1);
		var output={browser:browser,serverChecks:checks,assetChecks:assetResults,failureCount:failures};
		summary.textContent=failures?failures+' diagnostic check(s) failed.':'All static boot checks passed. Use storefront debug mode to capture an application runtime error.';
		report.textContent=JSON.stringify(output,null,2);runButton.disabled=false;
	}
	runButton.addEventListener('click',run);
})();
</script>
</body>
</html>
