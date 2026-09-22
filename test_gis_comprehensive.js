const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots', 'gis_verification');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runComprehensiveGisTests() {
  console.log('=== STARTING LANDGUARD AI COMPREHENSIVE GIS VERIFICATION ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  // Step 1: Sign in
  console.log('1. Signing in as Super Admin...');
  await page.goto('http://localhost:3000/signin');
  await page.fill('input[type="text"], input[type="email"]', 'admin@landguard.ai');
  await page.fill('input[type="password"]', 'LandGuard@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // Step 2: Open GIS Page
  console.log('2. Navigating to /gis ...');
  await page.goto('http://localhost:3000/gis');
  await page.waitForTimeout(3000);

  const canvas = await page.$('canvas.maplibregl-canvas');
  console.log('   - MapLibre Canvas Present:', !!canvas);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_gis_initial_load.png') });

  // Step 3: Hard Refresh on GIS Page
  console.log('3. Testing Hard Refresh on /gis ...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const canvasAfterReload = await page.$('canvas.maplibregl-canvas');
  console.log('   - MapLibre Canvas Present after Reload:', !!canvasAfterReload);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_gis_after_reload.png') });

  // Step 4: Navigate away to /route-planning and return to /gis
  console.log('4. Testing Navigation to /route-planning and back to /gis ...');
  await page.goto('http://localhost:3000/route-planning');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_route_planning_map.png') });

  await page.goto('http://localhost:3000/gis');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_gis_navigated_back.png') });

  await browser.close();
  console.log('=== COMPREHENSIVE GIS VERIFICATION COMPLETE ===');
}

runComprehensiveGisTests().catch(console.error);
