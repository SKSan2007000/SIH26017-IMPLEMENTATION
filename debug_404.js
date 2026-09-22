const { chromium } = require('playwright');

async function checkWhy404() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/project-head');
  await page.waitForTimeout(2000);
  const content = await page.content();
  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());
  console.log('Includes 404?', content.includes('404'));
  const idx = content.indexOf('404');
  if (idx !== -1) {
    console.log('Context around 404:', content.substring(Math.max(0, idx - 100), idx + 100));
  }
  await browser.close();
}

checkWhy404();
