const { chromium } = require('playwright');
const path = require('path');

async function testGisMap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}]`, response.url());
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}]`, msg.text());
    }
  });

  await page.goto('http://localhost:3000/signin');
  await page.fill('input[type="text"], input[type="email"]', 'admin@landguard.ai');
  await page.fill('input[type="password"]', 'LandGuard@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log('Navigating to /gis ...');
  await page.goto('http://localhost:3000/gis');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(__dirname, 'public', 'gis_debug.png') });
  await browser.close();
}

testGisMap().catch(console.error);
