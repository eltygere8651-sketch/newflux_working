const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const PROD_URL = 'https://ais-pre-uzidc7cka25vd3nbj5myiw-352265948901.europe-west2.run.app';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

async function check() {
  console.log("=== 1, 2, 4, 7: VERIFICAR URLS EN PRODUCCIÓN (AI STUDIO SHARED URL) ===");
  const icons = [
    '/apple-touch-icon.png',
    '/apple-touch-icon-180.png',
    '/apple-touch-icon-167.png',
    '/apple-touch-icon-152.png'
  ];

  for (const path of icons) {
    const res = await fetchUrl(PROD_URL + path);
    console.log(`\nURL: ${path}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Cache-Control: ${res.headers['cache-control']}`);
    console.log(`ETag: ${res.headers['etag']}`);
    console.log(`Last-Modified: ${res.headers['last-modified']}`);
    console.log(`Size: ${res.body.length} bytes`);
    
    // Check local dist matching
    try {
      const localBody = fs.readFileSync('dist' + path);
      const localHash = crypto.createHash('sha256').update(localBody).digest('hex');
      const remoteHash = crypto.createHash('sha256').update(res.body).digest('hex');
      console.log(`Matches local dist?: ${localHash === remoteHash}`);
    } catch (e) {
      console.log(`Local file missing in dist: dist${path}`);
    }
  }

  console.log("\n=== 3: DIST INDEX.HTML ===");
  const index = fs.readFileSync('dist/index.html', 'utf8');
  console.log("apple-touch-icon en dist/index.html:");
  index.split('<').forEach(tag => {
    if (tag.includes('apple-touch-icon')) {
      console.log('<' + tag.split('>')[0] + '>');
    }
  });

  console.log("\n=== 8: DIST VS PUBLIC MATCH ===");
  let allMatch = true;
  for (const path of icons) {
    try {
      const p = path.replace('/', '');
      const distHash = crypto.createHash('sha256').update(fs.readFileSync('dist/' + p)).digest('hex');
      const publicHash = crypto.createHash('sha256').update(fs.readFileSync('public/' + p)).digest('hex');
      console.log(`${p} dist == public: ${distHash === publicHash}`);
      if (distHash !== publicHash) allMatch = false;
    } catch(e) {
      console.log(`Missing file for comparison: ${path}`);
      allMatch = false;
    }
  }
}
check().catch(console.error);
