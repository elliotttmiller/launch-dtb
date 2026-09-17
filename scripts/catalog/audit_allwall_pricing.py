#!/usr/bin/env python3
"""Create the documentation-only All-Wall price-evidence audit.

Uses All-Wall's public sitemap as a bounded discovery index and requests only
candidate product pages.  It intentionally does not mutate the source catalog.
"""
import csv, html as html_lib, re
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote
from time import monotonic

import requests

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
OUT = ROOT / "docs/catalog_prices/allwall"
SITEMAP = "https://www.all-wall.com/sitemap_www.all-wall.com_Index.xml"
HEADERS = {"User-Agent": "DrywallToolboxCatalogAudit/1.0 (public-price-research)"}
# Discovery terms are intentionally limited to brands represented in the active
# DTB catalog. They only bound pages fetched; they are not match confidence
# gates. Exact displayed MPN equality remains the sole acceptance criterion.
BRAND_URL_TERMS = {
    "Columbia Tools": ("columbia",),
    "TapeTech": ("tapetech",),
    "LEVEL5": ("level5", "level-5"),
    "Platinum Drywall Tools": ("platinum",),
    "SurPro": ("surpro",),
    "Dura-Stilts": ("dura-stilt", "durastilt"),
}

def clean(v): return (v or "").strip()
def norm(v): return re.sub(r"[^A-Z0-9]", "", clean(v).upper())
def log(message):
    stamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{stamp}] {message}", flush=True)
def number(v):
    m = re.search(r"\d+(?:\.\d{1,2})?", v or "")
    return m.group(0) if m else ""
def meta(page, prop):
    m = re.search(r'<meta[^>]+(?:property|itemprop)=["\']'+re.escape(prop)+r'["\'][^>]+content=["\']([^"\']*)', page, re.I)
    return html_lib.unescape(m.group(1)).strip() if m else ""
def title(page):
    m = re.search(r"<title>(.*?)</title>", page, re.I|re.S)
    return re.sub(r"\s+", " ", html_lib.unescape(m.group(1))).replace(" | All-Wall.com", "").strip() if m else ""
def mpn(page):
    """Read All-Wall's displayed manufacturer part number, never retailer SKU."""
    m = re.search(r'<div[^>]+class=["\'][^"\']*\bmpn\b[^"\']*["\'][^>]*>\s*MPN\s*:\s*([^<]+)', page, re.I)
    return clean(html_lib.unescape(m.group(1))) if m else ""
def price(page):
    # The first product Offer belongs to the actual PDP, unlike related items.
    m = re.search(r'itemprop=["\']offers["\'][\s\S]{0,900}?itemprop=["\']price["\']\s+content=["\']([^"\']+)', page, re.I)
    return number(m.group(1)) if m else ""
def availability(page):
    v = meta(page, "og:availability")
    if v: return v
    m = re.search(r'itemprop=["\']availability["\'][^>]+href=["\']https?://schema.org/([^"\']+)', page, re.I)
    return m.group(1) if m else ""
def fetch(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=35)
        return url, r.text if r.ok else "", "" if r.ok else f"HTTP {r.status_code}"
    except requests.RequestException as e:
        return url, "", type(e).__name__
def write_csv(path, fields, records):
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader(); w.writerows(records)

def main():
    started = monotonic()
    checked = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    log("Loading official DTB catalog...")
    with CATALOG.open(encoding="utf-8-sig", newline="") as f: all_rows = list(csv.DictReader(f))
    rows = [r for r in all_rows if clean(r["SKU"]) and r["Type"] != "variable" and (clean(r["Regular price"]) or clean(r["Sale price"]))]
    catalog_brands = sorted({clean(r["Brands"]) for r in rows if clean(r["Brands"])})
    log(f"Catalog loaded: {len(all_rows)} records; {len(rows)} eligible price-owning SKUs across {', '.join(catalog_brands)}.")
    log("Downloading public All-Wall sitemap index...")
    index_xml = requests.get(SITEMAP, headers=HEADERS, timeout=45).text
    child = re.search(r"<loc>(.*?)</loc>", index_xml).group(1)
    site_xml = requests.get(child, headers=HEADERS, timeout=75).text
    urls = re.findall(r"<loc>(.*?)</loc>", site_xml)
    active_terms = tuple(term for brand in catalog_brands for term in BRAND_URL_TERMS.get(brand, (brand.lower(),)))
    urls = [url for url in urls if any(term in unquote(url).lower() for term in active_terms)]
    log(f"Public sitemap loaded and brand-scoped: {len(urls)} All-Wall URLs for {', '.join(catalog_brands)}. Extracting displayed MPNs...")
    # Extract public PDP MPNs only from URLs for active DTB brands. URL wording,
    # title, length, product condition, and retailer SKU are not match gates;
    # exact normalized MPN-to-DTB-SKU equality is the sole criterion.
    requested = sorted(set(urls))
    pages, errors = {}, {}
    completed = 0
    with ThreadPoolExecutor(max_workers=24) as pool:
        fs = [pool.submit(fetch, u) for u in requested]
        for future in as_completed(fs):
            u, text, err = future.result()
            completed += 1
            if text: pages[u] = text
            else: errors[u] = err
            if completed == 1 or completed % 25 == 0 or completed == len(requested):
                elapsed = max(monotonic() - started, 0.01)
                rate = completed / elapsed
                remaining = (len(requested) - completed) / rate if rate else 0
                log(f"PDP extraction: {completed}/{len(requested)} complete; {len(pages)} fetched; {len(errors)} errors; estimated {remaining / 60:.1f} min remaining.")
    mpn_index = defaultdict(list)
    for url, page in pages.items():
        displayed_mpn = mpn(page)
        if displayed_mpn:
            mpn_index[norm(displayed_mpn)].append((url, page))
    log(f"PDP extraction complete: {len(pages)} pages fetched, {len(errors)} errors, {len(mpn_index)} distinct displayed MPNs indexed.")
    master, unmatched = [], []
    for row in rows:
        dtb_sku, brand = clean(row["SKU"]), clean(row["Brands"])
        dtb_mpn = clean(row.get("Meta: _dtb_mpn")) or clean(row.get("Meta: schema_mpn"))
        base = {"dtb_brand":brand,"dtb_product_name":clean(row["Name"]),"dtb_sku":dtb_sku,"dtb_mpn":dtb_mpn,
                "dtb_regular_price":number(row["Regular price"]),"dtb_sale_price":number(row["Sale price"]),
                "dtb_map_price":number(row.get("Meta: _dtb_map_price")),"checked_at":checked}
        valid = mpn_index.get(norm(dtb_sku), [])
        if valid:
            u,page=valid[0]; awname=title(page); awmpn=mpn(page); awprice=price(page); avail=availability(page)
            # Price is accepted only when publicly rendered as an item Offer.
            accepted=bool(awprice)
            method="EXACT_MPN"
            note=f"All-Wall displayed MPN {awmpn} exactly matches DTB SKU {dtb_sku} after punctuation-only normalization. The All-Wall SKU field intentionally stores this MPN; retailer-internal SKU data is not extracted."
            record={**base,"allwall_product_name":awname,"allwall_sku":awmpn,"allwall_url":u,
                    "allwall_regular_price":"","allwall_sale_price":"","allwall_current_price":awprice if accepted else "",
                    "allwall_availability":avail,"match_status":"VERIFIED_PRODUCT","match_confidence":"HIGH",
                    "match_method":method,"price_vs_dtb_map":"","evidence_notes":note}
            if base["dtb_map_price"] and accepted:
                a,b=float(awprice),float(base["dtb_map_price"])
                record["price_vs_dtb_map"]="MATCHES_DTB_MAP" if a==b else ("ABOVE_DTB_MAP" if a>b else "BELOW_DTB_MAP")
            elif accepted: record["price_vs_dtb_map"]="DTB_MAP_UNKNOWN"
            master.append(record)
        else:
            status="NOT_FOUND"
            reason="No publicly extracted All-Wall displayed MPN exactly equals this DTB SKU after punctuation-only normalization."
            record={**base,"allwall_product_name":"","allwall_sku":"","allwall_url":"","allwall_regular_price":"","allwall_sale_price":"","allwall_current_price":"","allwall_availability":"","match_status":status,"match_confidence":"","match_method":"","price_vs_dtb_map":"","evidence_notes":reason}
            master.append(record)
            unmatched.append({**base,"status":status,"candidate_allwall_product":"","candidate_allwall_sku":"","candidate_url":"","reason":reason})
    OUT.mkdir(parents=True, exist_ok=True)
    fields=["dtb_brand","dtb_product_name","dtb_sku","dtb_mpn","dtb_regular_price","dtb_sale_price","dtb_map_price","allwall_product_name","allwall_sku","allwall_url","allwall_regular_price","allwall_sale_price","allwall_current_price","allwall_availability","match_status","match_confidence","match_method","price_vs_dtb_map","evidence_notes","checked_at"]
    write_csv(OUT/"allwall_pricing_master.csv",fields,master)
    review=[{"Brand":r["dtb_brand"],"Product Name":r["dtb_product_name"],"DTB SKU":r["dtb_sku"],"All-Wall SKU":r["allwall_sku"],"DTB Regular Price":r["dtb_regular_price"],"DTB MAP":r["dtb_map_price"],"All-Wall Price":r["allwall_current_price"],"Match Status":r["match_status"],"All-Wall URL":r["allwall_url"],"Review Notes":r["evidence_notes"]} for r in master if r["match_status"]!="VERIFIED_PRODUCT"]
    write_csv(OUT/"allwall_pricing_review.csv",list(review[0]) if review else ["Brand"],review)
    write_csv(OUT/"unmatched_products.csv",["dtb_brand","dtb_product_name","dtb_sku","dtb_mpn","status","candidate_allwall_product","candidate_allwall_sku","candidate_url","reason","checked_at"],unmatched)
    rules=[] # Exact normalized MPN equality is the only rule.
    write_csv(OUT/"normalization_rules.csv",["brand","rule_type","allwall_pattern","dtb_pattern","verified_examples","confidence","notes"],rules)
    c=Counter(r["match_status"] for r in master); prices=sum(bool(r["allwall_current_price"]) for r in master)
    report=f"# All-Wall catalog pricing audit\n\nChecked: {checked}\n\n## Scope\n\n- Catalog records examined: {len(all_rows)}\n- Eligible price-owning SKUs: {len(rows)}\n- Variable parents excluded: {sum(r['Type']=='variable' for r in all_rows)}\n- Brands represented: {', '.join(catalog_brands)}\n- All-Wall pages fetched: {len(requested)} (limited to the active DTB brand scope)\n\n## Results\n\n- Verified product matches: {c['VERIFIED_PRODUCT']}\n- Possible matches requiring review: {c['POSSIBLE_MATCH']}\n- Not found with this public, identifier-led audit: {c['NOT_FOUND']}\n- Verified publicly displayed All-Wall prices: {prices}\n\n## Identifier findings\n\nThe audit extracts the displayed `MPN` from All-Wall pages in the active DTB-brand scope and writes it to `allwall_sku`. All-Wall's retailer-internal SKU is neither extracted nor exported. A match is approved whenever the punctuation-normalized displayed MPN exactly equals a DTB SKU; no brand, title, URL, length, product-condition, prefix, or other gate is applied.\n\n## Limitations\n\nThis is a public sitemap/PDP extraction with no authentication or access-control bypass. An exact MPN match establishes the match; a missing public MPN remains NOT_FOUND. Prices are volatile public observations and should be rechecked before commercial action.\n"
    (OUT/"allwall_pricing_report.md").write_text(report,encoding="utf-8")
    (OUT/"README.md").write_text("# All-Wall pricing evidence\n\nDocumentation-only public-price audit generated by `scripts/catalog/audit_allwall_pricing.py`. The canonical DTB catalog was not modified. See `allwall_pricing_report.md` for scope and limitations.\n",encoding="utf-8")
    log(f"Complete in {(monotonic() - started) / 60:.1f} min: eligible={len(rows)}, verified={c['VERIFIED_PRODUCT']}, possible={c['POSSIBLE_MATCH']}, not_found={c['NOT_FOUND']}, priced={prices}, requested_pages={len(requested)}.")
if __name__ == '__main__': main()
