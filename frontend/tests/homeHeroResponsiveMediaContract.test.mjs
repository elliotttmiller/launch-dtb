import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const frontendRoot = new URL('frontend/', repoRoot);

const HERO_COMPONENT = new URL('src/components/home/HomeHero.jsx', frontendRoot);
const HERO_STYLES = new URL('src/styles/home-hero.css', frontendRoot);
const DESKTOP_HERO = new URL('src/assets/media/home/home-hero-desktop.webp', frontendRoot);
const MOBILE_HERO = new URL('src/assets/media/home/home-hero-mobile.webp', frontendRoot);

async function readHeroSource() {
  return readFile(HERO_COMPONENT, 'utf8');
}

async function readHeroStyles() {
  return readFile(HERO_STYLES, 'utf8');
}

test('HomeHero owns one semantic hero and uses browser-native art direction', async () => {
  const source = await readHeroSource();

  assert.match(source, /home-hero-desktop\.webp/);
  assert.match(source, /home-hero-mobile\.webp/);
  assert.match(source, /<picture className="home-hero__media" aria-hidden="true">/);
  assert.match(source, /media="\(max-width: 640px\)"/);
  assert.match(source, /srcSet=\{homeHeroMobileUrl\}/);
  assert.match(source, /src=\{homeHeroDesktopUrl\}/);
  assert.match(source, /type="image\/webp"/);

  assert.doesNotMatch(source, /home-hero\.webp/);
  assert.doesNotMatch(source, /window\.innerWidth|matchMedia\(|useMediaQuery|isMobile/);
});

test('HomeHero marks the above-the-fold image as the LCP-priority resource', async () => {
  const source = await readHeroSource();

  assert.match(source, /alt=""/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /loading="eager"/);
  assert.match(source, /fetchPriority="high"/);
  assert.match(source, /draggable="false"/);
});

test('Home hero artwork remains full-bleed and focal positioning stays in CSS', async () => {
  const css = await readHeroStyles();

  assert.match(css, /\.home-hero__media\s*\{[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?\}/);
  assert.match(css, /\.home-hero__media-image\s*\{[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*68% 50%;[\s\S]*?\}/);
  assert.match(css, /@media \(min-width: 901px\) and \(max-width: 1199px\)[\s\S]*?object-position:\s*72% 50%;/);
  assert.match(css, /@media \(min-width: 641px\) and \(max-width: 900px\)[\s\S]*?object-position:\s*73% 50%;/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?object-position:\s*64% 50%;/);

  const mediaBlock = css.match(/\.home-hero__media\s*\{[\s\S]*?\}/)?.[0] ?? '';
  assert.doesNotMatch(mediaBlock, /mask-image|transform:|right:\s*-|width:\s*58%|object-fit:\s*contain/);
});

test('hero presentation keeps image, ambient, scrim, and content as separate layers', async () => {
  const css = await readHeroStyles();

  assert.match(css, /\.home-hero__media\s*\{[\s\S]*?z-index:\s*0;/);
  assert.match(css, /\.home-hero__ambient\s*\{[\s\S]*?z-index:\s*1;/);
  assert.match(css, /\.home-hero__scrim\s*\{[\s\S]*?z-index:\s*2;/);
  assert.match(css, /\.home-hero__content\s*\{[\s\S]*?z-index:\s*3;/);
});

test('responsive hero source assets exist and remain below the current regression ceiling', async () => {
  const [desktop, mobile] = await Promise.all([
    stat(DESKTOP_HERO),
    stat(MOBILE_HERO),
  ]);

  assert.ok(desktop.size > 0, 'desktop hero must not be empty');
  assert.ok(mobile.size > 0, 'mobile hero must not be empty');

  // This is a regression ceiling, not the final performance target. The assets
  // should be recompressed further after visual QA without changing this media contract.
  assert.ok(desktop.size <= 1_300_000, `desktop hero is unexpectedly large: ${desktop.size} bytes`);
  assert.ok(mobile.size <= 1_300_000, `mobile hero is unexpectedly large: ${mobile.size} bytes`);
});
