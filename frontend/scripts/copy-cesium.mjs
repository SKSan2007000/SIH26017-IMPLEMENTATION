import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), 'node_modules/cesium/Build/Cesium');
const destDir = path.resolve(process.cwd(), 'public/cesium');

const folders = ['Assets', 'ThirdParty', 'Widgets', 'Workers'];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const folder of folders) {
  const src = path.join(srcDir, folder);
  const dest = path.join(destDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`[cesium-copy] Successfully copied ${folder} to ${dest}`);
  } else {
    console.warn(`[cesium-copy] Warning: ${src} not found`);
  }
}

// Copy Cesium.js if exists
const cesiumJsSrc = path.join(srcDir, 'Cesium.js');
const cesiumJsDest = path.join(destDir, 'Cesium.js');
if (fs.existsSync(cesiumJsSrc)) {
  fs.copyFileSync(cesiumJsSrc, cesiumJsDest);
}

console.log('[cesium-copy] Cesium static assets copied to public/cesium.');
