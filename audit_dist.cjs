const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const path = require('path');

async function run() {
  console.log("=== 1, 3, 7, 8, 15: DIST ICONS ANALYSIS ===");
  const files = fs.readdirSync('dist').filter(f => f.includes('icon') || f.includes('favicon'));
  for (const f of files) {
    const p = path.join('dist', f);
    const stat = fs.statSync(p);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    console.log(`\nFile: ${f}`);
    console.log(`Size: ${stat.size} bytes`);
    console.log(`SHA256: ${hash}`);
    
    if (f.endsWith('.png')) {
      const meta = await sharp(p).metadata();
      console.log(`Format: ${meta.format}`);
      console.log(`Size: ${meta.width}x${meta.height}`);
      console.log(`Channels: ${meta.channels} (Alpha: ${meta.hasAlpha})`);
      
      // Let's check if the image has ACTUAL transparent pixels, or just an alpha channel
      const stats = await sharp(p).stats();
      console.log(`Is opaque (alpha = 255): ${stats.channels[3] ? stats.channels[3].min === 255 : 'No alpha channel'}`);
    }
  }

  console.log("\n=== 2, 11: DIST INDEX.HTML ===");
  const index = fs.readFileSync('dist/index.html', 'utf8');
  console.log("apple-touch-icon references in dist/index.html:");
  index.split('<').forEach(tag => {
    if (tag.includes('apple-touch-icon')) {
      console.log('<' + tag.split('>')[0] + '>');
    }
  });

  console.log("\n=== 5: SERVICE WORKER ===");
  const sw = fs.readFileSync('dist/sw.js', 'utf8');
  console.log("SW CACHE_NAME:", sw.match(/CACHE_NAME\s*=\s*"([^"]+)"/)?.[1]);
  
  console.log("\n=== 6: MANIFEST.JSON ===");
  console.log(fs.readFileSync('dist/manifest.json', 'utf8').substring(0, 300) + '...');
}
run();
