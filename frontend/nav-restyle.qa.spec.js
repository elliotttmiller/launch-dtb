import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1280, height: 800 },
]) {
  test(`desktop product navigation ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    const trigger = page.getByRole('button', { name: 'All Products' });
    await trigger.hover();
    const dropdown = page.getByRole('region', { name: 'All Products navigation' });
    await expect(dropdown).toBeVisible();
    await dropdown.locator('.dtb-desktop-nav-dropdown__scroller').evaluate((scroller) => {
      scroller.innerHTML = `
        <div class="dtb-desktop-nav-dropdown__links has-taxonomy-groups">
          <div class="dtb-desktop-nav-taxonomy-group">
            <a class="dtb-desktop-nav-taxonomy-group__heading" href="#"><span>Automatic Taping Tools</span><svg width="14" height="14"></svg></a>
            <div class="dtb-desktop-nav-taxonomy-group__children"><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Angle Heads</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Automatic Tapers</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Corner Rollers</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Flat Boxes</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Loading Pumps</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Nail Spotters</a></div>
          </div>
          <div class="dtb-desktop-nav-taxonomy-group">
            <a class="dtb-desktop-nav-taxonomy-group__heading" href="#"><span>Semi-Automatic Taping Tools</span><svg width="14" height="14"></svg></a>
            <div class="dtb-desktop-nav-taxonomy-group__children"><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Compound Applicators</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Compound Tubes</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Corner Flushers</a><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Semi-Automatic Tapers</a></div>
          </div>
          <div class="dtb-desktop-nav-taxonomy-group"><a class="dtb-desktop-nav-taxonomy-group__heading" href="#"><span>Stilts</span><svg width="14" height="14"></svg></a><div class="dtb-desktop-nav-taxonomy-group__children"><a class="dtb-desktop-nav-taxonomy-group__child" href="#">Stilts</a></div></div>
        </div>`;
    });
    const bounds = await dropdown.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    await expect(dropdown.getByText('Automatic Taping Tools', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Semi-Automatic Taping Tools', { exact: true })).toBeVisible();
    await page.screenshot({ path: `nav-restyle-${viewport.width}.png`, fullPage: false });
    await context.close();
  });
}
