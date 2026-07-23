import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { fetchCatalogProducts } from '../../services/catalogPlatformCache.js';
import './products-selector.css';
import './products-selector-slideshow.css';

const ALL_PRODUCTS_CATEGORY = {
  key: 'all-products',
  slug: 'all-products',
  name: 'All Products',
  isAllProducts: true,
};

const ALL_PRODUCTS_PREVIEW_LIMIT = 8;
const ALL_PRODUCTS_SLIDE_INTERVAL_MS = 3800;

const COLUMBIA_CATEGORY_IMAGE_OVERRIDES = {
  'automatic_tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_taper_04-scaled.webp',
  'automatic-tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_taper_04-scaled.webp',
  'corner_tools': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_8cfb_01.webp',
  'corner-tools': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_8cfb_01.webp',
  'finishing_boxes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_10ffba_01.webp',
  'finishing-boxes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_10ffba_01.webp',
  'handles': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_mh_all_01-scaled.webp',
  'handles_extensions': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_mh_all_01-scaled.webp',
  'handles-extensions': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_mh_all_01-scaled.webp',
  'nail_spotters': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_3ns_01.webp',
  'nail-spotters': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_3ns_01.webp',
  'parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
  'replacement_parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
  'replacement-parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
  'pumps': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_hmp_01.webp',
  'predator_family': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
  'predator-family': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
  'semi_automatic_tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
  'semi-automatic-tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
  'semi_automatic_taper': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
  'semi-automatic-taper': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
  'toolsets': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_ts_01.webp',
  'tool-sets-kits': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/columbia_tools_ts_01.webp',
};

/**
 * Brand+category image overrides.
 * Keyed by brand slug → category key/slug → image URL.
 * Used when the API returns a non-representative image for a category card.
 */
const CATEGORY_IMAGE_OVERRIDES = {
  tapetech: {
    'automatic_tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_07tt_04.webp',
    'automatic-tapers': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_07tt_04.webp',
    'compound_tubes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ct42tt_01.webp',
    'compound-tubes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ct42tt_01.webp',
    'corner_tools': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ca08tt_01.webp',
    'corner-tools': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ca08tt_01.webp',
    'finishing_boxes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ez07tt_01.webp',
    'finishing-boxes': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ez07tt_01.webp',
    'handles': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'handles_extensions': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'handles-extensions': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'pumps': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_76ttca_01.webp',
    'nail_spotters': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ns03tt_02.webp',
    'nail-spotters': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/tapetech_ns03tt_02.webp',
  },
  'columbia-tools': COLUMBIA_CATEGORY_IMAGE_OVERRIDES,
  'columbia-taping-tools': COLUMBIA_CATEGORY_IMAGE_OVERRIDES,
  'platinum-drywall-tools': {
    'handles': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/platinum_pt_bh34_01.webp',
    'handles-extensions': 'https://elliottm4.sg-host.com/wp-content/uploads/2026/media/platinum_pt_bh34_01.webp',
  },
};

function toBrandSlug(brandLabel = '') {
  return brandLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveCategoryImage(brand, category) {
  const slug = toBrandSlug(brand);
  const catKey = (category.key || category.slug || '').toLowerCase();
  const normalizedCatKey = catKey.replace(/_/g, '-');
  const underscoredCatKey = catKey.replace(/-/g, '_');
  const overrides = CATEGORY_IMAGE_OVERRIDES[slug] || {};
  return overrides[catKey] || overrides[normalizedCatKey] || overrides[underscoredCatKey] || category.image || '';
}

const WORDPRESS_RESIZED_IMAGE_RE = /-\d+x\d+(?=\.(?:avif|jpe?g|png|webp)(?:[?#]|$))/i;
const SELECTOR_IMAGE_SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

function normalizePreviewImageUrl(src = '') {
  if (!src || src.startsWith('data:') || src.endsWith('.svg')) return src;
  return src.replace(WORDPRESS_RESIZED_IMAGE_RE, '');
}

function withUrlParam(src, key, value) {
  try {
    const url = new URL(src);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return src;
  }
}

function toCssUrl(src = '') {
  if (!src) return undefined;
  return `url("${String(src).replace(/"/g, '%22')}")`;
}

function resolvePreviewImageMeta(src = '') {
  const normalizedSrc = normalizePreviewImageUrl(src);
  if (!normalizedSrc || normalizedSrc.endsWith('.svg')) {
    return { src: normalizedSrc, srcSet: undefined, sizes: undefined };
  }

  if (/cdn\.shopify\.com/i.test(normalizedSrc)) {
    return {
      src: withUrlParam(normalizedSrc, 'width', '960'),
      srcSet: [480, 720, 960, 1280]
        .map((width) => `${withUrlParam(normalizedSrc, 'width', String(width))} ${width}w`)
        .join(', '),
      sizes: SELECTOR_IMAGE_SIZES,
    };
  }

  return {
    src: normalizedSrc,
    srcSet: `${normalizedSrc} 1x, ${normalizedSrc} 2x`,
    sizes: SELECTOR_IMAGE_SIZES,
  };
}

function primaryProductImage(product = {}) {
  return product?.media?.image
    || product?.cardProduct?.image
    || product?.image
    || '';
}

function AllProductsSlideshow({ brand, images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const availableImages = useMemo(
    () => images.filter((src) => src && !failedImages.has(src)),
    [failedImages, images],
  );

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages(new Set());
  }, [brand, images]);

  useEffect(() => {
    if (availableImages.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const advance = () => {
      if (document.visibilityState !== 'visible') return;
      setActiveIndex((current) => (current + 1) % availableImages.length);
    };
    const timer = window.setInterval(advance, ALL_PRODUCTS_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [availableImages.length]);

  useEffect(() => {
    if (availableImages.length < 2) return;
    const nextImage = new Image();
    nextImage.src = availableImages[(activeIndex + 1) % availableImages.length];
  }, [activeIndex, availableImages]);

  if (availableImages.length === 0) return null;

  return (
    <div className="product-category-card__slideshow" aria-hidden="true">
      {availableImages.map((src, index) => {
        const preview = resolvePreviewImageMeta(src);
        return (
          <img
            key={src}
            src={preview.src}
            srcSet={preview.srcSet}
            sizes={preview.sizes}
            alt=""
            className={`product-category-card__slide${index === activeIndex % availableImages.length ? ' is-active' : ''}`}
            width={640}
            height={427}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            onError={() => setFailedImages((current) => new Set(current).add(src))}
          />
        );
      })}
    </div>
  );
}

function ProductCategoryCard({ brand, category, index, onSelectCategory, allProductsImages = [] }) {
  const isAllProducts = Boolean(category?.isAllProducts);
  const resolvedImage = isAllProducts ? '' : resolveCategoryImage(brand, category);
  const [failedImage, setFailedImage] = useState({ key: '', src: '' });
  const previewImage = resolvePreviewImageMeta(resolvedImage);
  const imageKey = `${toBrandSlug(brand)}:${category.key || category.slug || category.name}:${previewImage.src}`;
  const cardImage = failedImage.key === imageKey && failedImage.src === previewImage.src ? '' : previewImage.src;
  const hasSlideshow = isAllProducts && allProductsImages.length > 0;
  const cardClassName = `product-category-card${cardImage || hasSlideshow ? '' : ' product-category-card--no-image'}${isAllProducts ? ' product-category-card--all-products' : ''}`;
  const cardStyle = {
    animationDelay: `${(index + 1) * 0.07}s`,
    ...(cardImage ? { '--selector-card-image': toCssUrl(cardImage) } : {}),
  };

  return (
    <button
      type="button"
      className={cardClassName}
      style={cardStyle}
      onClick={() => onSelectCategory(category)}
    >
      {hasSlideshow && <AllProductsSlideshow brand={brand} images={allProductsImages} />}
      {cardImage && (
        <img
          src={cardImage}
          srcSet={previewImage.srcSet}
          sizes={previewImage.sizes}
          alt={category.name}
          className="product-category-card__image"
          width={640}
          height={427}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 4 ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedImage({ key: imageKey, src: previewImage.src })}
        />
      )}
      <div className="product-category-card__scrim" />
      <div className="product-category-card__content">
        <div className="product-category-card__text">
          <h3 className="product-category-card__name">{category.name}</h3>
          <span className="product-category-card__count">{category.count} product{category.count !== 1 ? 's' : ''}</span>
        </div>
        <ChevronRight className="product-category-card__chevron" size={18} />
      </div>
    </button>
  );
}

export default function ProductsCategorySelector({
  brand,
  brandLogo,
  categories,
  onSelectCategory,
  onBack,
}) {
  const [allProductsImages, setAllProductsImages] = useState([]);
  const normalizedCategories = Array.isArray(categories) ? categories : [];
  const categoryProductCount = normalizedCategories.reduce((sum, category) => (
    sum + Number(category?.count || category?.productCount || 0)
  ), 0);

  useEffect(() => {
    let cancelled = false;
    const loadPreviews = async () => {
      try {
        const response = await fetchCatalogProducts({
          brands: [brand],
          page: 1,
          perPage: ALL_PRODUCTS_PREVIEW_LIMIT,
          sort: 'popular',
        });
        if (cancelled) return;
        const images = Array.from(new Set(
          (Array.isArray(response?.items) ? response.items : [])
            .map(primaryProductImage)
            .map(normalizePreviewImageUrl)
            .filter((src) => src && !src.endsWith('.svg')),
        )).slice(0, ALL_PRODUCTS_PREVIEW_LIMIT);
        setAllProductsImages(images);
      } catch {
        if (!cancelled) setAllProductsImages([]);
      }
    };

    if (brand) loadPreviews();
    else setAllProductsImages([]);
    return () => { cancelled = true; };
  }, [brand]);

  const allProductsCard = {
    ...ALL_PRODUCTS_CATEGORY,
    count: categoryProductCount,
    image: '',
  };
  const displayCategories = [
    allProductsCard,
    ...normalizedCategories.filter((category) => !['all-products', 'all_products'].includes(String(category?.slug || category?.key || '').toLowerCase())),
  ];

  return (
    <div className="product-selector">
      <div className="product-selector-header">
        <button
          type="button"
          onClick={onBack}
          className="back-button dtb-product-nav-back dtb-product-nav-back--icon-only"
          aria-label="Back to brands"
          title="Back to brands"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="product-selector-header-content">
          {brandLogo && (
            <img
              src={brandLogo}
              alt={`${brand} logo`}
              className="product-brand-header-logo"
            />
          )}
        </div>
      </div>

      <div className="product-categories-grid">
        {displayCategories.map((category, index) => (
          <ProductCategoryCard
            key={category.key || category.slug || category.name}
            brand={brand}
            category={category}
            index={index}
            onSelectCategory={onSelectCategory}
            allProductsImages={category.isAllProducts ? allProductsImages : []}
          />
        ))}
      </div>
    </div>
  );
}
