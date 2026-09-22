const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots', 'e2e');

async function testAllRoleLogins() {
  console.log('Testing each of the 8 roles logging in via /signin UI...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const roles = [
    { label: 'Super Admin', email: 'admin@landguard.ai', expected: '/admin' },
    { label: 'Project Head', email: 'head@landguard.ai', expected: '/dashboard/project-head' },
    { label: 'District Officer', email: 'district@landguard.ai', expected: '/dashboard/district' },
    { label: 'Land Acquisition Officer', email: 'lao@landguard.ai', expected: '/dashboard/land-acquisition' },
    { label: 'Supervisor', email: 'supervisor@landguard.ai', expected: '/dashboard/supervisor' },
    { label: 'Field Officer', email: 'field@landguard.ai', expected: '/dashboard/field' },
    { label: 'Citizen', email: 'citizen@landguard.ai', expected: '/portal/citizen' },
    { label: 'Contractor', email: 'contractor@landguard.ai', expected: '/portal/contractor' },
  ];

  for (const r of roles) {
    console.log(`\nTesting login as ${r.label} (${r.email})...`);
    await page.goto('http://localhost:3000/signin');
    await page.waitForTimeout(1000);

    // Fill form directly to be 100% reliable
    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.fill(r.email);
      await passInput.fill('LandGuard@2026');
      
      const submitBtn = await page.$('button[type="submit"]:has-text("SIGN IN")');
      if (submitBtn) {
        await submitBtn.click();
        try {
          await page.waitForURL((url) => !url.pathname.includes('/signin') && url.pathname.includes(r.expected), { timeout: 10000 });
        } catch (e) {
          await page.waitForTimeout(3000);
        }
      }
    }

    const currentUrl = page.url();
    console.log(`Landed at: ${currentUrl}`);
    const passed = currentUrl.includes(r.expected);
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${r.label} login -> ${currentUrl}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `role_${r.label.replace(/\s+/g, '_')}.png`) });
  }

  await browser.close();
}

testAllRoleLogins().catch(console.error);
