const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const url = 'https://www.fluxplay.cc/icon-512.png';
https.get(url, (res) => {
  let data = [];
  res.on('data', d => data.push(d));
  res.on('end', () => {
    const buf = Buffer.concat(data);
    const hex = buf.subarray(0, 16).toString('hex');
    console.log(`PROD URL: ${url}`);
    console.log(`HEX HEAD: ${hex}`);
    if (hex.startsWith('efbfbd')) {
      console.log('CORRUPTED: UTF-8 REPLACEMENT CHARS DETECTED');
    }
  });
});
