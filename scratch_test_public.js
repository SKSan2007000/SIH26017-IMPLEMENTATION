const { chromium } = require('playwright');

const PUBLIC_URL = 'https://unnecessary-sailing-spelling-sensors.trycloudflare.com';

async function runVerification() {
  console.log('Testing LandGuard AI Public URL:', PUBLIC_URL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

  async function checkPage(name, path, expectedContentCheck) {
    try {
      const url = `${PUBLIC_URL}${path}`;
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response ? response.status() : 0;
      const title = await page.title();
      const bodyText = await page.innerText('body');
      const passed = status === 200 && (expectedContentCheck ? expectedContentCheck(bodyText) : true);
      results.push({ name, path, status, title, passed });
      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} (${path}) -> HTTP ${status}`);
    } catch (err) {
      results.push({ name, path, status: 'ERROR', error: err.message, passed: false });
      console.error(`[FAIL] ${name} (${path}) -> ${err.message}`);
    }
  }

  // 1. Landing / Home
  await checkPage('Home / Landing', '/', (txt) => txt.includes('LandGuard') || txt.includes('Delays'));

  // 2. Sign In
  await checkPage('Sign In Page', '/signin', (txt) => txt.includes('Sign In') || txt.includes('Super Admin'));

  // 3. Perform Login
  try {
    console.log('Attempting login on public portal...');
    await page.goto(`${PUBLIC_URL}/signin`, { waitUntil: 'networkidle' });
    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.fill('admin@landguard.ai');
      await passInput.fill('LandGuard@2026');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('[PASS] Login submitted, current URL:', page.url());
    }
  } catch (e) {
    console.error('[FAIL] Login error:', e.message);
  }

  // 4. Core Features
  await checkPage('Dashboard', '/dashboard');
  await checkPage('Project Management', '/projects');
  await checkPage('2D GIS Map', '/gis');
  await checkPage('3D Digital Twin', '/twin');
  await checkPage('AI Risk Prediction & Analytics', '/risk');
  await checkPage('Analytics & Insights', '/analytics');
  await checkPage('Officer Allocation & Workload', '/officers');
  await checkPage('Field Verification', '/field');
  await checkPage('Evidence & Documents', '/documents');
  await checkPage('Design & Engineering Reviews', '/designs');
  await checkPage('Contractor Operations & Progress', '/operations');
  await checkPage('Citizen / Stakeholder Portal', '/citizen');
  await checkPage('Notifications & Alerts', '/notifications');
  await checkPage('Reports & Command Centre', '/reports');
  await checkPage('Audit Trail & Compliance', '/audit');
  await checkPage('Admin Portal', '/admin');

  console.log('\n================ SUMMARY ================');
  console.log(`Total Tested: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  await browser.close();
}

runVerification().catch(console.error);
