# Drywall AI Knowledge Base Architecture

## Purpose

`scripts/catalog/drywall-knowledge/` is the deterministic domain-intelligence library for the DTB AI catalog editor. It complements, but never replaces, the canonical catalog and the SEO pre-generation evidence boundary.

The library exists to answer reusable trade questions: what a tool family does, where it belongs in the professional finishing workflow, which buyer questions matter, which mechanisms are meaningful, which configuration dimensions distinguish products, which terms are related or distinct, and which claims require exact evidence.

It does not store SKU-specific specifications, prices, availability, exact compatibility, package contents, warranty terms, or generated copy.

## Ownership and authority

1. `products/launch/official/dtb_official_catalog.csv` owns canonical product facts and protected identifiers.
2. `scripts/catalog/catalog_seo_pre_generation.py` owns deterministic evidence-packet preparation and QA.
3. Official manufacturer technical material may supplement exact evidence when a generation workflow explicitly performs verified research.
4. `scripts/catalog/drywall-knowledge/` owns reusable drywall-domain knowledge and deterministic context compilation.
5. The downstream AI editor proposes copy only; application must retain existing protected-identity and catalog-validation guardrails.

## Architecture

```text
canonical catalog
  -> SEO pre-generation evidence packet
  -> deterministic drywall-domain classification
  -> core + family + domain + terminology context compiler
  -> compact DrywallDomainContext
  -> AI generation request (context and product evidence remain separate)
  -> deterministic output validation
  -> review/application workflow
```

No vector store, embeddings, retrieval database, second AI classification call, or per-SKU prompt patch is required.

## Domain families

- `taping`: automatic and semi-automatic tapers.
- `flat_finishing`: finishing boxes, nailspotters, smoothing blades.
- `corner_finishing`: corner finishers, corner applicator boxes, corner flushers, corner rollers, applicator heads.
- `compound_delivery`: compound tubes, loading pumps, loading adapters, handle systems.
- `supporting_equipment`: drywall sanders, stilts, storage cases, tool sets, maintenance kits.
- `parts_and_service`: replacement assemblies, replacement components, commodity hardware.

## Domain contract

Every domain defines a trade role, workflow position, prioritized buyer questions, evidence priorities, structured mechanism knowledge, configuration dimensions, generic system relationships, exact-compatibility evidence rules, terminology, editorial guidance, claims requiring evidence, common catalog errors, search-intent patterns, and maintainership references.

Mechanisms are structured objects so the editor can understand *why* a documented feature matters without assuming that every SKU in the domain contains it.

Buyer questions are divided into primary and secondary questions. They prioritize evidence use; they are never mandatory headings and never authorize invented answers.

## Classification

`classifyDrywallDomain()` uses only normalized evidence text and deterministic domain signals. Part classification is evaluated before tool-domain classification. The classifier returns `high`, `medium`, or `low` confidence and reasons.

Low-confidence classification is a review condition. It must not silently become product truth. The fallback value exists only to preserve a total TypeScript return type for callers that choose to inspect the result.

## Context compilation

`buildDrywallDomainContext()` compiles one compact context from:

- global editorial and evidence policy;
- the product's domain family;
- one domain record;
- relevant terminology and claim discipline;
- optional evidence richness, compatibility, package-content, variation, feature-system, and brand-spelling signals.

Unrelated domains are not injected. Source references are maintainership provenance and are not automatically added to model prompts.

## Integration contract

`buildCatalogEditorKnowledge(packet, options)` is the normal downstream entry point. It accepts the existing generation/evidence packet shape, classifies the domain, derives evidence-presence flags, resolves canonical brand spelling where possible, and returns both the classification and compiled context.

The AI request must keep these channels separate:

```text
SYSTEM / DOMAIN CONTEXT
  result.context.text

PRODUCT EVIDENCE PACKET
  exact authoritative packet JSON
```

Domain context explains how to interpret evidence. It does not become evidence.

## Evidence discipline

Exact dimensions, weight, materials, capacity, compatibility, package contents, adjustment ranges, blade/wheel construction, warranty, certifications, service intervals, country of origin, and performance outcomes require authoritative product evidence.

Generic workflow relationships may be explained, but exact cross-brand/cross-model fitment must never be inferred.

## Editorial sufficiency

There is no universal word-count target. Simple hardware should stay concise. Complex tapers, boxes, stilts, sets, or assemblies may receive deeper treatment when authoritative evidence supports it. The governing rule is: communicate all commercially meaningful supported evidence clearly, then stop.

## Research provenance

The initial library is synthesized from official manufacturer product-family pages and technical/product documentation including Columbia Tools, TapeTech, LEVEL5, and Dura-Stilts. Manufacturer-specific marketing claims are not promoted into generic domain truth. The central `sources.ts` registry exists for maintainership provenance.

## Maintenance rule

Do not add a global rule because one SKU generated poorly. First identify whether the defect is evidence preparation, domain classification, shared family knowledge, domain knowledge, terminology, prompt composition, model variance, or output QA. Change the owning stage only when the failure represents a reusable deficiency.
