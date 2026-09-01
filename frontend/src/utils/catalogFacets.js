import { brandToSlug, canonicalBrandLabel, canonicalDisplayCategorySlug, sortBrandsBy } from './catalogUrlState.js';

const LEGACY_CATEGORY_SLUG_ALIASES = {
  'automatic-taping-tool-sets': 'automatic-tool-sets',
  'semi-automatic-tools': 'semi-automatic-taping-tools',
  'semi-automatic-taping-tool-sets': 'semi-automatic-tool-sets',
  'tool-sets': 'semi-automatic-tool-sets',
  'tool-sets-automatic-taping-tools': 'automatic-tool-sets',
};

export function canonicalCatalogCategorySlug(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return LEGACY_CATEGORY_SLUG_ALIASES[slug] || slug;
}

export function normalizeDisplayCategorySlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildDisplayCategoryUrl(slug) {
  return `/products?display_category=${encodeURIComponent(slug)}`;
}

/**
 * Build a URL against the canonical WooCommerce product category taxonomy.
 * `category` is resolved server-side as a product_cat slug (including child
 * terms) before the legacy metadata fallback is considered. Known historical
 * storefront aliases are normalized here so stale callers cannot emit links
 * to terms that no longer exist in the canonical taxonomy.
 */
export function buildCatalogCategoryUrl(slug) {
  return `/products?category=${encodeURIComponent(canonicalCatalogCategorySlug(slug))}`;
}

/**
 * Build a URL against the dedicated category landing page route. This is
 * what the storefront nav and sitemap should point at — `/category/:slug`
 * renders the same catalog engine as `/products` plus category hero/SEO
 * treatment. `buildCatalogCategoryUrl` is kept for any legacy callers that
 * still need the query-param form.
 */
export function buildCategoryPageUrl(slug) {
  return `/category/${encodeURIComponent(canonicalCatalogCategorySlug(slug))}`;
}

export function normalizeCatalogBrandEntry(rawBrand = {}) {
  const label = canonicalBrandLabel(rawBrand.label || rawBrand.name || rawBrand.key || rawBrand.slug || '');
  if (!label) return null;
  const slug = brandToSlug(label);
  if (!slug) return null;
  const productCount = Number(rawBrand.productCount || rawBrand.count || 0);

  return {
    ...rawBrand,
    key: slug,
    label,
    name: label,
    slug,
    productCount,
    count: productCount,
  };
}

export function dedupeCatalogBrandEntries(rawBrands = []) {
  const bySlug = new Map();

  (Array.isArray(rawBrands) ? rawBrands : []).forEach((rawBrand) => {
    const brand = normalizeCatalogBrandEntry(rawBrand);
    if (!brand) return;

    const existing = bySlug.get(brand.slug);
    if (!existing) {
      bySlug.set(brand.slug, brand);
      return;
    }

    // Alias facets frequently describe the same product set. Preserve the
    // canonical entry and use the highest reported count, not a summed count.
    const productCount = Math.max(existing.productCount || 0, brand.productCount || 0);
    bySlug.set(brand.slug, {
      ...existing,
      logo: existing.logo || brand.logo,
      image: existing.image || brand.image,
      imageUrl: existing.imageUrl || brand.imageUrl,
      productCount,
      count: productCount,
    });
  });

  return sortBrandsBy(Array.from(bySlug.values()), 'label');
}

export function toCatalogBrand(rawBrand = {}) {
  const brand = normalizeCatalogBrandEntry(rawBrand);
  if (!brand) return null;
  return { name: brand.name, slug: brand.slug, count: brand.productCount };
}

export function mapCatalogBrands(rawBrands = []) {
  return dedupeCatalogBrandEntries(rawBrands)
    .map((brand) => ({ name: brand.name, slug: brand.slug, count: brand.productCount }));
}

export function mergeCatalogDisplayCategories(displayCategoriesByBrand = {}) {
  const merged = new Map();
  Object.values(displayCategoriesByBrand || {}).forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      const slug = canonicalDisplayCategorySlug(item?.slug || item?.key);
      if (!slug) return;
      const count = Number(item?.productCount || item?.count || 0);
      const existing = merged.get(slug);
      merged.set(slug, {
        slug,
        label: item?.label || item?.name || item?.key || slug,
        count: Math.max(existing?.count || 0, count),
      });
    });
  });
  return Array.from(merged.values())
    .filter((item) => item.count > 0)
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));
}

/**
 * Normalize backend-owned WooCommerce product category navigation groups.
 * The backend supplies parent/child taxonomy structure; the frontend only
 * adapts the contract into links and never re-classifies products itself.
 */
export function normalizeCatalogNavigationGroups(rawGroups = []) {
  return (Array.isArray(rawGroups) ? rawGroups : [])
    .map((rawGroup) => {
      const label = rawGroup?.label || rawGroup?.name || '';
      const slug = canonicalCatalogCategorySlug(rawGroup?.slug || rawGroup?.key || '');
      const children = (Array.isArray(rawGroup?.children) ? rawGroup.children : [])
        .map((rawChild) => {
          const childLabel = rawChild?.label || rawChild?.name || '';
          const childSlug = canonicalCatalogCategorySlug(rawChild?.slug || rawChild?.key || '');
          if (!childLabel || !childSlug) return null;
          return {
            ...rawChild,
            label: childLabel,
            slug: childSlug,
            count: Number(rawChild?.productCount || rawChild?.count || 0),
            to: buildCategoryPageUrl(childSlug),
          };
        })
        .filter(Boolean)
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));

      if (!label || !slug) return null;
      return {
        ...rawGroup,
        label,
        slug,
        count: Number(rawGroup?.productCount || rawGroup?.count || 0),
        to: buildCategoryPageUrl(slug),
        children,
      };
    })
    .filter(Boolean);
}

export function normalizeCatalogCategoryEntry(category) {
  if (typeof category === 'string') {
    return {
      label: category,
      slug: canonicalCatalogCategorySlug(normalizeDisplayCategorySlug(category)),
    };
  }
  const label = category?.label || category?.name || '';
  const slug = canonicalCatalogCategorySlug(category?.slug || category?.key || normalizeDisplayCategorySlug(label));
  return { label, slug };
}
