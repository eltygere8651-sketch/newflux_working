const https = require('https');
const DEV_URL = 'https://ais-dev-uzidc7cka25vd3nbj5myiw-352265948901.europe-west2.run.app';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "Cache-Control": "no-cache" } }, (res) => {
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
  const icons = [
    '/apple-touch-icon.png',
    '/apple-touch-icon-180.png'
  ];
  for (const path of icons) {
    const res = await fetchUrl(DEV_URL + path);
    console.log(`\nURL: ${DEV_URL}${path}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Size: ${res.body.length} bytes`);
  }
}
check().catch(console.error);
