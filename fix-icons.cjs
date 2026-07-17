const sharp = require('sharp');
const fs = require('fs');

async function fix() {
  const svg = fs.readFileSync('public/icon-512.svg');
  
  // Create an opaque apple-touch-icon (remove alpha channel, fill background)
  await sharp(svg)
    .resize(180, 180)
    .flatten({ background: { r: 0, g: 0, b: 0, alpha: 1 } }) // iOS requires opaque
    .png()
    .toFile('public/apple-touch-icon.png');
    
  fs.copyFileSync('public/apple-touch-icon.png', 'public/apple-touch-icon-precomposed.png');

  // Regenerate standard web manifest PNGs properly as binary
  const sizes = [152, 167, 180, 192, 256, 384, 512, 1024];
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
  }
  
  fs.copyFileSync('public/icon-192.png', 'public/favicon.png');
}
fix().then(() => console.log('Icons fixed')).catch(console.error);
