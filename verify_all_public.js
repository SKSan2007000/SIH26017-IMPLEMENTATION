const { chromium } = require('playwright');

const PUBLIC_URL = 'https://unnecessary-sailing-spelling-sensors.trycloudflare.com';

const testPages = [
  { name: '1. Landing Page', path: '/' },
  { name: '2. Sign In Page', path: '/signin' },
  { name: '3. Super Admin Dashboard', path: '/admin' },
  { name: '4. Project Head Dashboard', path: '/dashboard/project-head' },
  { name: '5. District Officer Dashboard', path: '/dashboard/district' },
  { name: '6. Land Acquisition Officer Dashboard', path: '/dashboard/land-acquisition' },
  { name: '7. Field Officer Dashboard', path: '/dashboard/field' },
  { name: '8. Supervisor Dashboard', path: '/dashboard/supervisor' },
  { name: '9. Project Management', path: '/projects' },
  { name: '10. 2D GIS Map & Parcels', path: '/gis' },
  { name: '11. 3D Digital Twin & Elevation', path: '/twin' },
  { name: '12. AI Delay Risk Prediction & Explainability', path: '/risk' },
  { name: '13. Analytics & Corridors Insights', path: '/analytics' },
  { name: '14. Officer Allocation & Workload Tracking', path: '/officers' },
  { name: '15. Field Verification Portal', path: '/field' },
  { name: '16. Evidence & Document Management', path: '/documents' },
  { name: '17. Design & Engineering Alignment Workflow', path: '/designs' },
  { name: '18. Contractor Infrastructure Operations', path: '/portal/contractor' },
  { name: '19. Citizen Landowner Grievance Portal', path: '/portal/citizen' },
  { name: '20. Escalation & System Notifications', path: '/notifications' },
  { name: '21. Reports & Command Centre', path: '/reports' },
  { name: '22. Compliance Audit Trail', path: '/audit' },
];

async function verifyAll() {
  console.log('Testing LandGuard AI Public Prototype:', PUBLIC_URL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  for (const item of testPages) {
    try {
      const fullUrl = `${PUBLIC_URL}${item.path}`;
      const resp = await page.goto(fullUrl, { waitUntil: 'load', timeout: 35000 });
      const status = resp ? resp.status() : 0;
      if (status === 200) {
        passed++;
        console.log(`[PASS] ${item.name} (${item.path}) -> HTTP ${status}`);
      } else {
        failed++;
        console.log(`[FAIL] ${item.name} (${item.path}) -> HTTP ${status}`);
      }
    } catch (e) {
      failed++;
      console.log(`[ERROR] ${item.name} (${item.path}) -> ${e.message}`);
    }
  }

  console.log('\n=============================================');
  console.log(`FINAL RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('=============================================');
  await browser.close();
}

verifyAll().catch(console.error);
