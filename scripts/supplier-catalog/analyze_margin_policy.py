#!/usr/bin/env python3
"""Analyze DTB catalog economics and recommend evidence-based MVP margin policy.

This is a read-only deterministic decision-support tool. It uses the canonical
WooCommerce catalog's actual COGS, configured MAP, and current prices to compute
SKU-level economics, robust distributions, brand/category segments, and a
conservative evidence-based minimum/target gross-margin policy recommendation.

It does NOT mutate the catalog and does NOT infer missing MAP or COGS.

Policy derivation deliberately uses only MAP-configured, positive-COGS,
price-owning rows. MAP margin is the primary policy evidence because current
prices may reflect legacy pricing errors. Variable parents are excluded because
WooCommerce variations own their prices.
"""
from __future__ import annotations
import argparse, csv, json, math, os, statistics, sys, tempfile
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_CEILING, ROUND_FLOOR
from pathlib import Path
from typing import Iterable
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "catalog"))
from official_catalog_schema import CatalogValidationError, validate_catalog  # noqa: E402
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
DEFAULT_REPORT = HERE / "results" / "margin" / "margin-policy-analysis.json"
DEFAULT_DETAIL_CSV = HERE / "results" / "margin" / "margin-policy-sku-detail.csv"
REGULAR_FIELD="Regular price"; SALE_FIELD="Sale price"; COST_FIELD="Cost of goods"; MAP_FIELD="Meta: _dtb_map_price"; BRAND_FIELD="Brands"; CATEGORY_FIELD="Categories"; TYPE_FIELD="Type"; SKU_FIELD="SKU"; NAME_FIELD="Name"
CENT=Decimal("0.01"); HUNDRED=Decimal("100"); PERCENT_QUANTUM=Decimal("0.01")
class MarginAnalysisError(RuntimeError): pass
def parse_decimal(value, *, field, sku, allow_blank=True, allow_zero=False):
    raw=(value or "").strip()
    if not raw and allow_blank: return None
    try: amount=Decimal(raw)
    except InvalidOperation as exc: raise MarginAnalysisError(f"{sku}: invalid {field} value {value!r}") from exc
    if not amount.is_finite() or amount < 0 or (amount == 0 and not allow_zero): raise MarginAnalysisError(f"{sku}: {field} must be a {'non-negative' if allow_zero else 'positive'} amount")
    return amount
def money(value): return "" if value is None else format(value.quantize(CENT), "f")
def percent(value): return "" if value is None else format(value.quantize(PERCENT_QUANTUM), "f")
def gross_profit(price,cost): return None if price is None or cost is None else price-cost
def gross_margin_pct(price,cost): return None if price is None or cost is None or price <= 0 else ((price-cost)/price)*HUNDRED
def markup_pct(price,cost): return None if price is None or cost is None or cost <= 0 else ((price-cost)/cost)*HUNDRED
def target_price(cost,target_margin_pct):
    if cost is None or cost <= 0 or target_margin_pct <= 0 or target_margin_pct >= HUNDRED: return None
    return (cost/(Decimal("1")-(target_margin_pct/HUNDRED))).quantize(CENT,rounding=ROUND_CEILING)
def allowable_cost(price,target_margin_pct): return None if price is None or price <= 0 else (price*(Decimal("1")-(target_margin_pct/HUNDRED))).quantize(CENT)
def percentile(values,probability):
    if not values: return None
    ordered=sorted(values)
    if len(ordered)==1: return ordered[0]
    position=probability*Decimal(len(ordered)-1); lower=int(position.to_integral_value(rounding=ROUND_FLOOR)); upper=int(math.ceil(float(position)))
    if lower==upper: return ordered[lower]
    fraction=position-Decimal(lower); return ordered[lower]+(ordered[upper]-ordered[lower])*fraction
def round_policy_down(value,increment):
    if increment <= 0: raise MarginAnalysisError("Policy increment must be positive")
    return ((value/increment).to_integral_value(rounding=ROUND_FLOOR)*increment).quantize(PERCENT_QUANTUM)
def describe(values: Iterable[Decimal]):
    ordered=sorted(list(values))
    if not ordered: return {"count":0}
    mean=sum(ordered,Decimal("0"))/Decimal(len(ordered)); median=Decimal(str(statistics.median([float(v) for v in ordered])))
    return {"count":len(ordered),"min":percent(ordered[0]),"p10":percent(percentile(ordered,Decimal("0.10"))),"p25":percent(percentile(ordered,Decimal("0.25"))),"median_p50":percent(median),"mean":percent(mean),"p75":percent(percentile(ordered,Decimal("0.75"))),"p90":percent(percentile(ordered,Decimal("0.90"))),"max":percent(ordered[-1])}
def policy_from_map_margins(values, *, minimum_sample_size, increment):
    distribution=describe(values); count=len(values)
    if count < minimum_sample_size: return {"status":"INSUFFICIENT_EVIDENCE","eligible_count":count,"minimum_sample_size":minimum_sample_size,"distribution":distribution,"recommended_minimum_margin_pct":None,"recommended_target_margin_pct":None}
    p25=percentile(values,Decimal("0.25")); p50=percentile(values,Decimal("0.50")); assert p25 is not None and p50 is not None
    minimum=round_policy_down(max(Decimal("0"),p25),increment); target=round_policy_down(max(minimum,p50),increment)
    return {"status":"EVIDENCE_AVAILABLE","eligible_count":count,"minimum_sample_size":minimum_sample_size,"method":{"minimum_margin":"P25 of eligible MAP gross margins, rounded down","target_margin":"P50/median of eligible MAP gross margins, rounded down","policy_increment_pct":percent(increment),"primary_evidence":"configured MAP + positive COGS on price-owning rows"},"distribution":distribution,"recommended_minimum_margin_pct":percent(minimum),"recommended_target_margin_pct":percent(target)}
def category_labels(raw): return [v.strip() for v in raw.split(",") if v.strip()] or ["(Uncategorized)"]
def read_rows(path):
    try:
        with path.open("r",encoding="utf-8-sig",newline="") as handle:
            reader=csv.DictReader(handle)
            if reader.fieldnames is None: raise MarginAnalysisError(f"{path}: missing CSV header")
            required={TYPE_FIELD,SKU_FIELD,NAME_FIELD,REGULAR_FIELD,SALE_FIELD,COST_FIELD,MAP_FIELD,BRAND_FIELD,CATEGORY_FIELD}; missing=sorted(required-set(reader.fieldnames))
            if missing: raise MarginAnalysisError(f"{path}: missing fields: {', '.join(missing)}")
            return list(reader)
    except (OSError,UnicodeError,csv.Error) as exc: raise MarginAnalysisError(f"Cannot read {path}: {exc}") from exc
def analyze_rows(rows, *, comparison_target_margin, minimum_sample_size, policy_increment):
    counts=Counter(); details=[]; overall_map_margins=[]; by_brand=defaultdict(list); by_category=defaultdict(list); current_margins=[]
    for row in rows:
        kind=(row.get(TYPE_FIELD) or "").strip()
        if kind=="variable": counts["variable_parents_excluded"]+=1; continue
        if kind not in {"simple","variation"}: counts["unsupported_type_excluded"]+=1; continue
        counts["price_owning_rows"]+=1; sku=(row.get(SKU_FIELD) or "").strip(); name=(row.get(NAME_FIELD) or "").strip(); brand=(row.get(BRAND_FIELD) or "").strip() or "(Unknown)"; categories=category_labels((row.get(CATEGORY_FIELD) or "").strip())
        regular=parse_decimal(row.get(REGULAR_FIELD),field="regular price",sku=sku,allow_zero=True); sale=parse_decimal(row.get(SALE_FIELD),field="sale price",sku=sku,allow_zero=True); cost=parse_decimal(row.get(COST_FIELD),field="cost of goods",sku=sku); map_price=parse_decimal(row.get(MAP_FIELD),field="MAP",sku=sku); effective=sale if sale is not None and sale>0 else regular
        if regular is not None: counts["with_regular_price"]+=1
        if cost is not None: counts["with_cogs"]+=1
        if map_price is not None: counts["with_map"]+=1
        if cost is not None and map_price is not None: counts["eligible_map_cost"]+=1
        current_margin=gross_margin_pct(effective,cost); regular_margin=gross_margin_pct(regular,cost); map_margin=gross_margin_pct(map_price,cost); current_markup=markup_pct(effective,cost); current_profit=gross_profit(effective,cost); target=target_price(cost,comparison_target_margin); allowable=allowable_cost(effective,comparison_target_margin); cost_gap=(cost-allowable) if cost is not None and allowable is not None else None
        if current_margin is not None: current_margins.append(current_margin)
        if map_margin is not None:
            overall_map_margins.append(map_margin); by_brand[brand].append(map_margin)
            for category in categories: by_category[category].append(map_margin)
        map_violation=map_price is not None and ((regular is not None and regular<map_price) or (sale is not None and sale<map_price))
        if map_violation: counts["map_violations"]+=1
        details.append({"sku":sku,"name":name,"type":kind,"brand":brand,"categories":" | ".join(categories),"regular_price":money(regular),"sale_price":money(sale),"effective_price":money(effective),"cogs":money(cost),"map_price":money(map_price),"gross_profit":money(current_profit),"current_gross_margin_pct":percent(current_margin),"regular_gross_margin_pct":percent(regular_margin),"current_markup_pct":percent(current_markup),"map_gross_margin_pct":percent(map_margin),"comparison_target_margin_pct":percent(comparison_target_margin),"target_margin_price":money(target),"allowable_cost_at_current_price":money(allowable),"cost_gap_vs_target":money(cost_gap),"map_violation":"1" if map_violation else "0"})
    brand_policy={k:policy_from_map_margins(v,minimum_sample_size=minimum_sample_size,increment=policy_increment) for k,v in sorted(by_brand.items())}; category_policy={k:policy_from_map_margins(v,minimum_sample_size=minimum_sample_size,increment=policy_increment) for k,v in sorted(by_category.items())}
    report={"schema_version":1,"scope":"price-owning simple products and variations; variable parents excluded","counts":dict(sorted(counts.items())),"comparison_target_margin_pct":percent(comparison_target_margin),"current_effective_margin_distribution":describe(current_margins),"map_margin_distribution":describe(overall_map_margins),"recommended_global_policy":policy_from_map_margins(overall_map_margins,minimum_sample_size=minimum_sample_size,increment=policy_increment),"brand_policies":brand_policy,"category_policies":category_policy,"interpretation":{"map_margin":"Gross margin available when selling at configured official MAP.","minimum_margin":"Evidence-derived lower guardrail candidate; not a substitute for MAP.","target_margin":"Evidence-derived central margin objective candidate; not permission to lower a higher current price.","current_margin":"Uses active sale price when a positive sale price exists; otherwise regular price.","allowable_cost":"Maximum COGS supported by the current effective price at the comparison target margin.","cost_gap":"Positive means actual COGS exceeds allowable cost at the current effective price; negative means cost headroom remains."}}
    return details,report
def write_json_atomic(path,payload):
    path.parent.mkdir(parents=True,exist_ok=True); handle=tempfile.NamedTemporaryFile("w",encoding="utf-8",newline="\n",delete=False,dir=path.parent,prefix=path.name+".",suffix=".tmp"); temp_path=Path(handle.name)
    try:
        with handle: json.dump(payload,handle,indent=2,sort_keys=True); handle.write("\n")
        os.replace(temp_path,path)
    except Exception: temp_path.unlink(missing_ok=True); raise
def write_detail_csv(path,rows):
    path.parent.mkdir(parents=True,exist_ok=True)
    if not rows: raise MarginAnalysisError("No price-owning rows available for detail report")
    handle=tempfile.NamedTemporaryFile("w",encoding="utf-8-sig",newline="",delete=False,dir=path.parent,prefix=path.name+".",suffix=".tmp"); temp_path=Path(handle.name)
    try:
        with handle:
            writer=csv.DictWriter(handle,fieldnames=list(rows[0]),lineterminator="\r\n"); writer.writeheader(); writer.writerows(rows)
        os.replace(temp_path,path)
    except Exception: temp_path.unlink(missing_ok=True); raise
def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument("--catalog",type=Path,default=DEFAULT_CATALOG); parser.add_argument("--report",type=Path,default=DEFAULT_REPORT); parser.add_argument("--detail-csv",type=Path,default=DEFAULT_DETAIL_CSV); parser.add_argument("--comparison-target-margin",default="30.00",help="Existing/proposed target margin used for target-price and cost-gap comparisons; default: 30.00"); parser.add_argument("--minimum-sample-size",type=int,default=5,help="Minimum eligible MAP+COGS observations required before recommending a policy; default: 5"); parser.add_argument("--policy-increment",default="0.50",help="Percentage-point increment used to round evidence-derived policy downward; default: 0.50"); args=parser.parse_args()
    if args.minimum_sample_size < 2: raise MarginAnalysisError("Minimum sample size must be at least 2")
    try: comparison_target=Decimal(str(args.comparison_target_margin)); policy_increment=Decimal(str(args.policy_increment))
    except InvalidOperation as exc: raise MarginAnalysisError("Margin and policy increment arguments must be numeric") from exc
    if comparison_target<=0 or comparison_target>=HUNDRED: raise MarginAnalysisError("Comparison target margin must be greater than 0 and less than 100")
    if policy_increment<=0: raise MarginAnalysisError("Policy increment must be positive")
    catalog=args.catalog.resolve(); validate_catalog(catalog,DEFAULT_GAPS); rows=read_rows(catalog); details,report=analyze_rows(rows,comparison_target_margin=comparison_target,minimum_sample_size=args.minimum_sample_size,policy_increment=policy_increment); report["catalog"]=str(catalog); report["minimum_sample_size"]=args.minimum_sample_size; report["policy_increment_pct"]=percent(policy_increment); write_json_atomic(args.report.resolve(),report); write_detail_csv(args.detail_csv.resolve(),details); policy=report["recommended_global_policy"]; assert isinstance(policy,dict); print("Margin policy analysis: " f"price_owners={report['counts'].get('price_owning_rows',0)}, " f"map+cogs={report['counts'].get('eligible_map_cost',0)}, " f"map_violations={report['counts'].get('map_violations',0)}, " f"policy_status={policy.get('status')}, " f"minimum={policy.get('recommended_minimum_margin_pct')}, " f"target={policy.get('recommended_target_margin_pct')}"); return 0
if __name__=="__main__":
    try: raise SystemExit(main())
    except (MarginAnalysisError,CatalogValidationError) as exc: print(f"ERROR: {exc}",file=sys.stderr); raise SystemExit(1)
