const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

async function fetchAsset(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://${HOST}:${PORT}${urlPath}`, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(data)
        });
      });
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log("=== 1. MANIFEST ===");
  const manifestRes = await fetchAsset('/manifest.json');
  console.log(`URL: http://localhost:3000/manifest.json`);
  console.log(`Status: ${manifestRes.status}`);
  if (manifestRes.status === 200) {
    const manifest = JSON.parse(manifestRes.body.toString());
    console.log("start_url:", manifest.start_url);
    console.log("display:", manifest.display);
    console.log("theme_color:", manifest.theme_color);
    console.log("icons:", JSON.stringify(manifest.icons, null, 2));
  }

  console.log("\n=== 2 & 3. ICONS HTTP 200, SIZE, MIME ===");
  const icons = [
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/favicon.png',
    '/icon-180.png',
    '/icon-192.png',
    '/icon-512.png'
  ];

  for (const icon of icons) {
    const res = await fetchAsset(icon);
    console.log(`\nIcon: ${icon}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`MIME Type: ${res.headers['content-type']}`);
    if (res.status === 200) {
      console.log(`Size in KB: ${(res.body.length / 1024).toFixed(2)} KB`);
      // Check if it's a valid PNG (starts with \x89PNG\r\n\x1A\n)
      const isPng = res.body.length >= 8 && 
                    res.body[0] === 0x89 && res.body[1] === 0x50 && 
                    res.body[2] === 0x4e && res.body[3] === 0x47 && 
                    res.body[4] === 0x0d && res.body[5] === 0x0a && 
                    res.body[6] === 0x1a && res.body[7] === 0x0a;
      console.log(`Is valid PNG: ${isPng}`);
    }
  }

  console.log("\n=== 4. INDEX.HTML APPLE-TOUCH-ICON ===");
  const indexRes = await fetchAsset('/index.html');
  const indexHtml = indexRes.body.toString();
  const appleTouchLines = indexHtml.split('\n').filter(line => line.includes('apple-touch-icon'));
  console.log(appleTouchLines.join('\n'));

  console.log("\n=== 5. SERVICE WORKER ===");
  const swRes = await fetchAsset('/sw.js');
  if (swRes.status === 200) {
    const swJs = swRes.body.toString();
    const cacheNameMatch = swJs.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
    if (cacheNameMatch) {
      console.log(`CACHE_NAME: ${cacheNameMatch[1]}`);
    }
    const assetsMatch = swJs.match(/ASSETS_TO_CACHE\s*=\s*(\[[^\]]+\])/);
    if (assetsMatch) {
      console.log(`ASSETS_TO_CACHE: ${assetsMatch[1].replace(/\s+/g, ' ')}`);
    }
  } else {
    console.log("Failed to fetch /sw.js, status:", swRes.status);
  }
}

runAudit().catch(console.error);
