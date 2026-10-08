import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CATEGORY_HERO_PRESENTATIONS,
  resolveCategoryHeroPresentation,
} from '../src/constants/categoryHeroPresentation.js';

const repoRoot = new URL('../../', import.meta.url);
const frontendRoot = new URL('frontend/', repoRoot);

const HERO_COMPONENT = new URL('src/components/catalog/CategoryHero.jsx', frontendRoot);
const HERO_STYLES = new URL('src/styles/category-hero.css', frontendRoot);

async function readHeroSource() {
  return readFile(HERO_COMPONENT, 'utf8');
}

async function readHeroStyles() {
  return readFile(HERO_STYLES, 'utf8');
}

test('category hero owns one stylesheet and keeps breadcrumb inside the content plane', async () => {
  const source = await readHeroSource();

  assert.match(source, /import '..\/..\/styles\/category-hero\.css';/);
  assert.doesNotMatch(source, /category-hero-refinements\.css/);

  const contentStart = source.indexOf('<div className="dtb-category-hero-card__content">');
  const breadcrumbStart = source.indexOf('<div className="dtb-category-hero__breadcrumb-stage">');
  const mediaStart = source.indexOf('<CategoryHeroMedia');

  assert.ok(contentStart >= 0);
  assert.ok(breadcrumbStart > contentStart);
  assert.ok(mediaStart > breadcrumbStart);
  assert.doesNotMatch(source, /Trusted Tools\. Stronger Results\./);
});

test('desktop hero uses compact 43/57 composition with a bounded seam', async () => {
  const css = await readHeroStyles();

  assert.match(css, /--dtb-category-copy-width:\s*43%/);
  assert.match(css, /--dtb-category-media-width:\s*57%/);
  assert.match(css, /--dtb-category-seam:\s*clamp\(1\.5rem,\s*2\.2vw,\s*2\.25rem\)/);
  assert.match(css, /height:\s*clamp\(15\.5rem,\s*16vw,\s*17\.5rem\)/);
  assert.match(css, /width:\s*calc\(100% \+ var\(--dtb-category-seam\)\)/);
  assert.doesNotMatch(css, /5\.4vw|6rem\)\)/);
});

test('media modes are bounded presentation metadata rather than slug-specific CSS', async () => {
  const css = await readHeroStyles();
  const source = await readHeroSource();

  assert.match(source, /data-presentation=\{presentation\}/);
  assert.match(css, /data-presentation='wide'/);
  assert.match(css, /data-presentation='tall'/);
  assert.match(css, /data-presentation='compact'/);
  assert.match(css, /data-presentation='oversized'/);

  assert.equal(resolveCategoryHeroPresentation('stilts'), CATEGORY_HERO_PRESENTATIONS.TALL);
  assert.equal(resolveCategoryHeroPresentation('automatic-tapers'), CATEGORY_HERO_PRESENTATIONS.WIDE);
  assert.equal(resolveCategoryHeroPresentation('flat-boxes'), CATEGORY_HERO_PRESENTATIONS.OVERSIZED);
  assert.equal(resolveCategoryHeroPresentation('corner-applicators-angle-boxes'), CATEGORY_HERO_PRESENTATIONS.STANDARD);

  assert.doesNotMatch(css, /stilts|automatic-tapers|flat-boxes|corner-applicators-angle-boxes/);
});

test('hero media keeps full product geometry, bottom alignment, and LCP priority', async () => {
  const source = await readHeroSource();
  const css = await readHeroStyles();

  assert.match(source, /loading="eager"/);
  assert.match(source, /fetchPriority="high"/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /draggable="false"/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /object-position:\s*50% 100%/);
  assert.match(css, /align-items:\s*flex-end/);
});

test('full-bleed category band no longer depends on negative margins', async () => {
  const css = await readHeroStyles();

  const layoutBlock = css.match(/\.dtb-catalog-category-layout > \.dtb-category-hero\s*\{[\s\S]*?\}/)?.[0] ?? '';
  assert.match(layoutBlock, /transform:\s*translateX/);
  assert.doesNotMatch(layoutBlock, /margin-left|margin-right|margin-inline/);
});


test('mobile category merchandising remains unified and anchors to the existing product listing', async () => {
  const hero = await readHeroSource();
  const css = await readHeroStyles();
  const page = await readFile(new URL('src/pages/ProductsCatalogPlatform.jsx', frontendRoot), 'utf8');
  assert.match(hero, /href="#dtb-category-products"/);
  assert.match(page, /id=\{isCategoryPageRoute \? "dtb-category-products" : undefined\}/);
  assert.match(css, /\.dtb-category-hero-card__content\s*\{\s*display:\s*contents;/);
  assert.match(css, /\.dtb-category-hero-card__copy\s*\{\s*order:\s*1;/);
  assert.match(css, /\.dtb-category-hero-card__media\s*\{\s*order:\s*2;/);
  assert.match(css, /\.dtb-category-hero__breadcrumb-stage\s*\{\s*order:\s*3;/);
});
