const { chromium } = require('playwright');

async function testLaunch() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/signin');
  console.log('Loaded signin page. Title:', await page.title());
  await browser.close();
  console.log('Launch test successful!');
}

testLaunch().catch((err) => {
  console.error('Launch failed:', err);
  process.exit(1);
});
