#!/usr/bin/env python3
"""Generate human-review pricing artifacts from the temporary DTB pricing CSV.

This utility is intentionally documentation-only. It never writes catalog values back to
WooCommerce, WordPress, the canonical catalog, or the source CSV. It creates:

- review/dtb_catalog_pricing_review.html: self-contained review UI with embedded source data.
- review/dtb_catalog_pricing_review.xlsx: offline review workbook with separate review columns.

Only Python's standard library is required so the generation path remains deterministic and
portable inside repository/operator environments.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import math
import re
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

EXPECTED_HEADERS = ["Brand", "Name", "SKU", "COG", "Regular Price", "Sale", "MAP Price"]
DEFAULT_SOURCE = Path(__file__).parent / "temp" / "dtb_official_catalog_pricing_only.csv"
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "review"
REVIEW_STATUSES = ["Unreviewed", "Correct", "Needs Correction", "Needs Research"]


def parse_money(value: str) -> float | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        number = float(value)
    except ValueError as exc:
        raise ValueError(f"Invalid numeric pricing value: {value!r}") from exc
    if not math.isfinite(number):
        raise ValueError(f"Non-finite pricing value: {value!r}")
    return number


def load_rows(source: Path) -> list[dict[str, object]]:
    with source.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != EXPECTED_HEADERS:
            raise ValueError(
                f"Unexpected source headers. Expected {EXPECTED_HEADERS!r}; got {reader.fieldnames!r}."
            )
        rows: list[dict[str, object]] = []
        seen_skus: set[str] = set()
        for row_number, raw in enumerate(reader, start=2):
            sku = (raw["SKU"] or "").strip()
            if not sku:
                raise ValueError(f"Missing SKU on CSV row {row_number}.")
            if sku in seen_skus:
                raise ValueError(f"Duplicate SKU {sku!r} on CSV row {row_number}.")
            seen_skus.add(sku)
            rows.append(
                {
                    "brand": (raw["Brand"] or "").strip(),
                    "name": (raw["Name"] or "").strip(),
                    "sku": sku,
                    "cog": parse_money(raw["COG"]),
                    "regular": parse_money(raw["Regular Price"]),
                    "sale": parse_money(raw["Sale"]),
                    "map": parse_money(raw["MAP Price"]),
                }
            )
    if not rows:
        raise ValueError("Pricing source contains no product rows.")
    return rows


def classify_warnings(row: dict[str, object]) -> list[str]:
    warnings: list[str] = []
    cog = row["cog"]
    regular = row["regular"]
    sale = row["sale"]
    map_price = row["map"]
    if cog is None:
        warnings.append("Missing COG")
    if regular is None:
        warnings.append("Missing Regular Price")
    if map_price is None:
        warnings.append("Missing MAP")
    if sale is not None:
        warnings.append("Sale Price Present")
    if cog is not None and regular is not None and regular < cog:
        warnings.append("Regular Below COG")
    if map_price is not None and regular is not None and regular < map_price:
        warnings.append("Regular Below MAP")
    if cog is not None and map_price is not None and map_price < cog:
        warnings.append("MAP Below COG")
    return warnings


def build_html(rows: list[dict[str, object]], source_label: str) -> str:
    payload_rows = []
    for index, row in enumerate(rows, start=1):
        payload_rows.append({**row, "index": index, "warnings": classify_warnings(row)})
    payload = json.dumps(payload_rows, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    generated = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    source_safe = html.escape(source_label)
    return f"""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\">
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
<title>DTB Catalog Pricing Review</title>
<style>
:root{{--ink:#14202b;--muted:#65717d;--line:#dfe5ea;--panel:#fff;--bg:#f4f6f8;--accent:#0d5ea6;--accent2:#eaf3fb;--good:#1d6b45;--goodbg:#eaf6ef;--warn:#8a5a00;--warnbg:#fff6df;--bad:#a62c2c;--badbg:#fff0f0;--shadow:0 10px 28px rgba(24,42,58,.08)}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}} button,input,select,textarea{{font:inherit}} button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{{outline:3px solid #8cc7f7;outline-offset:2px}}
.shell{{max-width:1220px;margin:auto;padding:26px 22px 48px}} .mast{{display:flex;gap:24px;align-items:flex-end;justify-content:space-between;margin-bottom:18px}} .eyebrow{{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}} h1{{font-size:29px;line-height:1.12;margin:6px 0 5px}} .sub{{color:var(--muted);max-width:760px}} .source{{font-size:12px;color:var(--muted);text-align:right}} .toolbar{{position:sticky;top:0;z-index:10;background:rgba(244,246,248,.94);backdrop-filter:blur(10px);padding:12px 0 14px;border-bottom:1px solid var(--line)}} .controls{{display:grid;grid-template-columns:minmax(230px,1.6fr) minmax(150px,.7fr) minmax(180px,.8fr) auto auto;gap:9px}} input[type=search],select{{width:100%;border:1px solid #cfd8df;background:#fff;border-radius:8px;padding:10px 12px;color:var(--ink)}} .btn{{border:1px solid #cbd5dd;background:#fff;border-radius:8px;padding:9px 12px;cursor:pointer;color:var(--ink);font-weight:650}} .btn:hover{{background:#f9fbfc}} .btn.primary{{background:var(--accent);border-color:var(--accent);color:white}} .progressRow{{display:flex;gap:14px;align-items:center;margin-top:11px}} .progressTrack{{height:7px;background:#dfe7ed;border-radius:999px;overflow:hidden;flex:1}} .progressFill{{height:100%;width:0;background:var(--accent)}} .progressText{{white-space:nowrap;font-size:13px;color:var(--muted)}}
.tabs{{display:flex;gap:4px;margin:18px 0 12px}} .tab{{border:0;background:transparent;padding:8px 11px;border-radius:7px;cursor:pointer;font-weight:750;color:var(--muted)}} .tab.active{{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(20,32,43,.08)}}
.review{{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px}} .card{{background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow)}} .productHead{{padding:24px 26px 19px;border-bottom:1px solid var(--line)}} .counter{{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.09em}} h2{{font-size:25px;line-height:1.2;margin:7px 0}} .identity{{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted)}} .chip{{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;padding:3px 9px;background:#fbfcfd;font-size:12px}} .pricing{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0}} .priceCell{{padding:22px 26px;border-bottom:1px solid var(--line)}} .priceCell:nth-child(odd){{border-right:1px solid var(--line)}} .priceLabel{{font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:var(--muted)}} .priceValue{{font-size:28px;font-weight:780;margin-top:4px;font-variant-numeric:tabular-nums}} .missing{{color:#8a5a00}} .detail{{font-size:12px;color:var(--muted);margin-top:2px}} .warningBox{{padding:17px 26px;border-bottom:1px solid var(--line)}} .warningTitle{{font-weight:800;margin-bottom:7px}} .warnings{{display:flex;gap:7px;flex-wrap:wrap}} .warn{{font-size:12px;background:var(--warnbg);color:var(--warn);border:1px solid #eedba6;border-radius:999px;padding:4px 8px}} .warn.danger{{background:var(--badbg);color:var(--bad);border-color:#f0caca}} .ok{{font-size:13px;color:var(--good)}} .nav{{display:flex;justify-content:space-between;gap:12px;padding:18px 26px}} .side{{padding:20px}} .side h3{{margin:0 0 12px;font-size:16px}} .statusGroup{{display:grid;gap:8px}} .status{{display:flex;align-items:center;gap:9px;border:1px solid var(--line);padding:10px;border-radius:8px;cursor:pointer}} .status input{{margin:0}} label.note{{display:block;font-weight:750;margin:17px 0 6px}} textarea{{width:100%;min-height:135px;resize:vertical;border:1px solid #cfd8df;border-radius:8px;padding:10px 11px}} .saveHint{{font-size:12px;color:var(--muted);margin-top:8px}} .metaActions{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}} .metaActions .btn{{font-size:12px;padding:8px}}
.catalogCard{{overflow:hidden}} .tableWrap{{overflow:auto;max-height:72vh}} table{{width:100%;border-collapse:separate;border-spacing:0;background:#fff}} th{{position:sticky;top:0;background:#f8fafb;border-bottom:1px solid var(--line);font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:left;color:var(--muted);padding:11px 12px;z-index:2}} td{{border-bottom:1px solid #edf1f4;padding:10px 12px;vertical-align:middle}} tr.clickable{{cursor:pointer}} tr.clickable:hover td{{background:#f7fbff}} .money{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}} .statusBadge{{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:750;background:#edf1f4;color:#596671}} .statusBadge.Correct{{background:var(--goodbg);color:var(--good)}} .statusBadge.Needs-Correction{{background:var(--badbg);color:var(--bad)}} .statusBadge.Needs-Research{{background:var(--warnbg);color:var(--warn)}} .empty{{padding:50px;text-align:center;color:var(--muted)}} .hidden{{display:none!important}}
.footerNote{{margin-top:18px;color:var(--muted);font-size:12px}} @media(max-width:900px){{.controls{{grid-template-columns:1fr 1fr}} .controls input[type=search]{{grid-column:1/-1}} .review{{grid-template-columns:1fr}} .source{{display:none}}}} @media(max-width:560px){{.shell{{padding:18px 12px 35px}} .controls{{grid-template-columns:1fr}} .controls input[type=search]{{grid-column:auto}} .pricing{{grid-template-columns:1fr}} .priceCell:nth-child(odd){{border-right:0}} .mast{{align-items:flex-start}} h1{{font-size:25px}} .productHead,.priceCell,.warningBox,.nav{{padding-left:18px;padding-right:18px}}}}
@media print{{body{{background:#fff}} .toolbar,.tabs,.side,.nav,.footerNote{{display:none!important}} .shell{{max-width:none;padding:0}} .review{{display:block}} .card{{box-shadow:none;border:0}} .productHead{{padding-top:0}} .pricing{{grid-template-columns:repeat(2,1fr)}} .priceCell:nth-child(odd){{border-right:1px solid var(--line)}}}}
</style>
</head>
<body>
<div class=\"shell\">
<header class=\"mast\"><div><div class=\"eyebrow\">Drywall Toolbox</div><h1>Catalog Pricing Review</h1><div class=\"sub\">Human validation copy. Review status and notes are annotations only; they never modify the source catalog or WooCommerce pricing.</div></div><div class=\"source\">Source: {source_safe}<br>Generated: {generated}</div></header>
<section class=\"toolbar\" aria-label=\"Review controls\"><div class=\"controls\"><input id=\"search\" type=\"search\" placeholder=\"Search product, SKU, or brand\" aria-label=\"Search products\"><select id=\"brand\" aria-label=\"Filter by brand\"></select><select id=\"filter\" aria-label=\"Filter review status\"><option value=\"all\">All products</option><option value=\"unreviewed\">Unreviewed</option><option value=\"Correct\">Reviewed: Correct</option><option value=\"Needs Correction\">Needs Correction</option><option value=\"Needs Research\">Needs Research</option><option value=\"warning\">Any pricing warning</option><option value=\"missing-cog\">Missing COG</option><option value=\"missing-map\">Missing MAP</option><option value=\"missing-regular\">Missing Regular Price</option><option value=\"below-cog\">Regular below COG</option><option value=\"below-map\">Regular below MAP</option></select><button class=\"btn\" id=\"exportBtn\">Export Review</button><button class=\"btn\" id=\"printBtn\">Print</button></div><div class=\"progressRow\"><div class=\"progressTrack\"><div class=\"progressFill\" id=\"progressFill\"></div></div><div class=\"progressText\" id=\"progressText\"></div></div></section>
<div class=\"tabs\"><button class=\"tab active\" data-tab=\"review\">Review one by one</button><button class=\"tab\" data-tab=\"catalog\">Catalog list</button></div>
<main>
<section id=\"reviewView\" class=\"review\"><article class=\"card\" id=\"productCard\"><div class=\"productHead\"><div class=\"counter\" id=\"counter\"></div><h2 id=\"name\"></h2><div class=\"identity\"><span id=\"brandChip\" class=\"chip\"></span><span id=\"skuChip\" class=\"chip\"></span></div></div><div class=\"pricing\" id=\"pricing\"></div><div class=\"warningBox\"><div class=\"warningTitle\">Pricing checks</div><div id=\"warnings\"></div></div><div class=\"nav\"><button class=\"btn\" id=\"prevBtn\">← Previous</button><button class=\"btn primary\" id=\"nextBtn\">Next →</button></div></article><aside class=\"card side\"><h3>Reviewer decision</h3><div class=\"statusGroup\" id=\"statusGroup\"></div><label class=\"note\" for=\"note\">Reviewer note</label><textarea id=\"note\" placeholder=\"Document what needs correction or what evidence still needs research.\"></textarea><div class=\"saveHint\">Saved automatically in this browser for this source SKU.</div><div class=\"metaActions\"><button class=\"btn\" id=\"importBtn\">Import Review</button><button class=\"btn\" id=\"clearBtn\">Clear Review</button></div><input id=\"importFile\" class=\"hidden\" type=\"file\" accept=\"application/json,.json\"></aside></section>
<section id=\"catalogView\" class=\"card catalogCard hidden\"><div class=\"tableWrap\"><table><thead><tr><th>#</th><th>Brand / Product</th><th>SKU</th><th class=\"money\">COG</th><th class=\"money\">Regular</th><th class=\"money\">Sale</th><th class=\"money\">MAP</th><th>Status</th></tr></thead><tbody id=\"catalogBody\"></tbody></table></div><div id=\"empty\" class=\"empty hidden\">No products match the current filters.</div></section>
</main><div class=\"footerNote\">This is a documentation/review projection. Pricing values are displayed exactly from the source CSV; missing values remain missing and are never inferred.</div></div>
<script id=\"pricing-data\" type=\"application/json\">{payload}</script>
<script>
(()=>{{
'use strict';
const rows=JSON.parse(document.getElementById('pricing-data').textContent);const KEY='dtb-pricing-review-v1';let state={{}};try{{state=JSON.parse(localStorage.getItem(KEY)||'{{}}')}}catch{{state={{}}}}let filtered=[];let currentSku=rows[0].sku;let tab='review';
const $=id=>document.getElementById(id);const money=v=>v===null?'Not set':new Intl.NumberFormat('en-US',{{style:'currency',currency:'USD'}}).format(v);const reviewFor=sku=>state[sku]||{{status:'Unreviewed',note:''}};const persist=()=>localStorage.setItem(KEY,JSON.stringify(state));
const statusClass=s=>s.replace(/ /g,'-'); const brands=[...new Set(rows.map(r=>r.brand))].sort((a,b)=>a.localeCompare(b)); $('brand').innerHTML='<option value="all">All brands</option>'+brands.map(b=>`<option>${{escapeHtml(b)}}</option>`).join('');
function escapeHtml(s){{return String(s).replace(/[&<>\"']/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}}[c]))}}
function matches(r){{const q=$('search').value.trim().toLowerCase();if(q&&!`${{r.name}} ${{r.sku}} ${{r.brand}}`.toLowerCase().includes(q))return false;if($('brand').value!=='all'&&r.brand!==$('brand').value)return false;const f=$('filter').value,rv=reviewFor(r.sku);if(f==='all')return true;if(f==='unreviewed')return rv.status==='Unreviewed';if(['Correct','Needs Correction','Needs Research'].includes(f))return rv.status===f;if(f==='warning')return r.warnings.length>0;if(f==='missing-cog')return r.cog===null;if(f==='missing-map')return r.map===null;if(f==='missing-regular')return r.regular===null;if(f==='below-cog')return r.warnings.includes('Regular Below COG');if(f==='below-map')return r.warnings.includes('Regular Below MAP');return true}}
function applyFilters(){{filtered=rows.filter(matches);if(!filtered.some(r=>r.sku===currentSku)&&filtered.length)currentSku=filtered[0].sku;render();}}
function priceCell(label,value,detail=''){{return `<div class="priceCell"><div class="priceLabel">${{label}}</div><div class="priceValue ${{value===null?'missing':''}}">${{money(value)}}</div><div class="detail">${{detail||(value===null?'Missing in source':'Recorded in source')}}</div></div>`}}
function warningMarkup(r){{if(!r.warnings.length)return '<div class="ok">No deterministic pricing relationship warnings detected.</div>';return '<div class="warnings">'+r.warnings.map(w=>`<span class="warn ${{/Below/.test(w)?'danger':''}}">${{escapeHtml(w)}}</span>`).join('')+'</div>'}}
function renderReview(){{if(!filtered.length){{$('productCard').innerHTML='<div class="empty">No products match the current filters.</div>';return}}const r=filtered.find(x=>x.sku===currentSku)||filtered[0];currentSku=r.sku;const pos=filtered.findIndex(x=>x.sku===r.sku);$('counter').textContent=`Product ${{pos+1}} of ${{filtered.length}} · Catalog #${{r.index}}`;$('name').textContent=r.name;$('brandChip').textContent=r.brand;$('skuChip').textContent='SKU '+r.sku;let regDetail='Recorded in source';if(r.regular!==null&&r.map!==null)regDetail=`${{r.regular>=r.map?money(r.regular-r.map)+' above MAP':money(r.map-r.regular)+' below MAP'}}`;if(r.regular!==null&&r.cog!==null&&r.regular<r.cog)regDetail+=` · ${{money(r.cog-r.regular)}} below COG`;$('pricing').innerHTML=priceCell('Cost / COG',r.cog)+priceCell('Regular Price',r.regular,regDetail)+priceCell('Sale Price',r.sale)+priceCell('MAP Price',r.map);$('warnings').innerHTML=warningMarkup(r);const rv=reviewFor(r.sku);$('statusGroup').innerHTML=['Unreviewed','Correct','Needs Correction','Needs Research'].map(s=>`<label class="status"><input type="radio" name="status" value="${{s}}" ${{rv.status===s?'checked':''}}> <span>${{s}}</span></label>`).join('');$('note').value=rv.note||'';$('prevBtn').disabled=pos<=0;$('nextBtn').disabled=pos>=filtered.length-1}}
function renderCatalog(){{$('catalogBody').innerHTML=filtered.map(r=>{{const rv=reviewFor(r.sku);return `<tr class="clickable" data-sku="${{escapeHtml(r.sku)}}"><td>${{r.index}}</td><td><strong>${{escapeHtml(r.name)}}</strong><br><span class="detail">${{escapeHtml(r.brand)}}</span></td><td><strong>${{escapeHtml(r.sku)}}</strong></td><td class="money">${{money(r.cog)}}</td><td class="money">${{money(r.regular)}}</td><td class="money">${{money(r.sale)}}</td><td class="money">${{money(r.map)}}</td><td><span class="statusBadge ${{statusClass(rv.status)}}">${{rv.status}}</span></td></tr>`}}).join('');$('empty').classList.toggle('hidden',filtered.length>0);document.querySelectorAll('tr[data-sku]').forEach(tr=>tr.addEventListener('click',()=>{{currentSku=tr.dataset.sku;setTab('review')}}))}}
function updateProgress(){{const reviewed=rows.filter(r=>reviewFor(r.sku).status!=='Unreviewed').length;const pct=Math.round(reviewed/rows.length*100);$('progressFill').style.width=pct+'%';$('progressText').textContent=`${{reviewed}} / ${{rows.length}} reviewed · ${{pct}}%`}}
function render(){{updateProgress();renderReview();renderCatalog()}}
function currentPos(){{return filtered.findIndex(r=>r.sku===currentSku)}} function move(delta){{const p=currentPos(),n=p+delta;if(n>=0&&n<filtered.length){{currentSku=filtered[n].sku;renderReview();window.scrollTo({{top:0,behavior:'smooth'}})}}}}
function setTab(next){{tab=next;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('reviewView').classList.toggle('hidden',tab!=='review');$('catalogView').classList.toggle('hidden',tab!=='catalog');render()}}
$('search').addEventListener('input',applyFilters);$('brand').addEventListener('change',applyFilters);$('filter').addEventListener('change',applyFilters);$('prevBtn').addEventListener('click',()=>move(-1));$('nextBtn').addEventListener('click',()=>move(1));document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));$('statusGroup').addEventListener('change',e=>{{if(e.target.name!=='status')return;state[currentSku]={{...reviewFor(currentSku),status:e.target.value}};persist();render()}});$('note').addEventListener('input',e=>{{state[currentSku]={{...reviewFor(currentSku),note:e.target.value}};persist();updateProgress()}});$('printBtn').addEventListener('click',()=>window.print());
$('exportBtn').addEventListener('click',()=>{{const exportRows=rows.map(r=>({{sku:r.sku,brand:r.brand,name:r.name,status:reviewFor(r.sku).status,note:reviewFor(r.sku).note}}));const blob=new Blob([JSON.stringify({{version:1,exportedAt:new Date().toISOString(),source:'{source_safe}',reviews:exportRows}},null,2)],{{type:'application/json'}});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dtb_catalog_pricing_review_annotations.json';a.click();URL.revokeObjectURL(a.href)}});
$('importBtn').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',async e=>{{const file=e.target.files[0];if(!file)return;try{{const obj=JSON.parse(await file.text());if(!Array.isArray(obj.reviews))throw new Error('Missing reviews array');for(const item of obj.reviews){{if(rows.some(r=>r.sku===item.sku)&&['Unreviewed','Correct','Needs Correction','Needs Research'].includes(item.status))state[item.sku]={{status:item.status,note:String(item.note||'')}}}}persist();render()}}catch(err){{alert('Could not import review file: '+err.message)}}e.target.value=''}});$('clearBtn').addEventListener('click',()=>{{if(confirm('Clear all saved review statuses and notes in this browser?')){{state={{}};persist();render()}}}});
document.addEventListener('keydown',e=>{{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='/'){{e.preventDefault();$('search').focus()}}}});applyFilters();
}})();
</script>
</body></html>"""


def col_name(index: int) -> str:
    out = ""
    while index:
        index, rem = divmod(index - 1, 26)
        out = chr(65 + rem) + out
    return out


def cell_xml(ref: str, value: object, style: int = 0) -> str:
    style_attr = f' s="{style}"' if style else ""
    if value is None or value == "":
        return f'<c r="{ref}"{style_attr}/>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}"{style_attr}><v>{value}</v></c>'
    text = xml_escape(str(value))
    return f'<c r="{ref}" t="inlineStr"{style_attr}><is><t xml:space="preserve">{text}</t></is></c>'


def build_xlsx(rows: list[dict[str, object]], destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    headers = ["#", "Brand", "Product", "SKU", "COG", "Regular Price", "Sale Price", "MAP Price", "Warnings", "Review Status", "Reviewer Note"]
    data: list[list[object]] = [headers]
    for idx, row in enumerate(rows, start=1):
        data.append([idx, row["brand"], row["name"], row["sku"], row["cog"], row["regular"], row["sale"], row["map"], "; ".join(classify_warnings(row)), "Unreviewed", ""])
    sheet_rows = []
    for r_idx, values in enumerate(data, start=1):
        cells = []
        for c_idx, value in enumerate(values, start=1):
            style = 1 if r_idx == 1 else (2 if c_idx in {5, 6, 7, 8} else 0)
            cells.append(cell_xml(f"{col_name(c_idx)}{r_idx}", value, style))
        sheet_rows.append(f'<row r="{r_idx}">{"".join(cells)}</row>')
    last_row = len(data)
    widths = [6, 20, 52, 20, 14, 16, 14, 14, 32, 20, 46]
    cols = ''.join(f'<col min="{i}" max="{i}" width="{width}" customWidth="1"/>' for i, width in enumerate(widths, start=1))
    status_formula = '"Unreviewed,Correct,Needs Correction,Needs Research"'
    sheet = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>{cols}</cols><sheetData>{''.join(sheet_rows)}</sheetData><autoFilter ref="A1:K{last_row}"/><dataValidations count="1"><dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="J2:J{last_row}"><formula1>{xml_escape(status_formula)}</formula1></dataValidation></dataValidations></worksheet>'''
    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174A73"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><numFmts count="1"><numFmt numFmtId="164" formatCode="$#,##0.00;[Red]-$#,##0.00"/></numFmts><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''
    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pricing Review" sheetId="1" r:id="rId1"/></sheets></workbook>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'''
    types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'''
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", types)
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", rels)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
        archive.writestr("xl/styles.xml", styles)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()
    rows = load_rows(args.source)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    html_path = args.output_dir / "dtb_catalog_pricing_review.html"
    xlsx_path = args.output_dir / "dtb_catalog_pricing_review.xlsx"
    html_path.write_text(build_html(rows, args.source.as_posix()), encoding="utf-8", newline="\n")
    build_xlsx(rows, xlsx_path)
    warnings = Counter(w for row in rows for w in classify_warnings(row))
    print(f"Generated {html_path} ({len(rows)} products)")
    print(f"Generated {xlsx_path} ({len(rows)} products)")
    for label, count in sorted(warnings.items()):
        print(f"  {label}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
