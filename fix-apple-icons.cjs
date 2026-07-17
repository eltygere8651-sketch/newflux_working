const sharp = require('sharp');
const fs = require('fs');

async function fix() {
  const svg = fs.readFileSync('public/icon-512.svg');
  
  // Apple specific sizes
  const appleSizes = [152, 167, 180];
  
  for (const size of appleSizes) {
    await sharp(svg)
      .resize(size, size)
      .flatten({ background: { r: 0, g: 0, b: 0 } }) 
      .removeAlpha() // Ensure no alpha channel
      .png()
      .toFile(`public/apple-touch-icon-${size}.png`);
  }
  
  // Create default apple-touch-icon.png and precomposed
  fs.copyFileSync('public/apple-touch-icon-180.png', 'public/apple-touch-icon.png');
  fs.copyFileSync('public/apple-touch-icon-180.png', 'public/apple-touch-icon-precomposed.png');
  
  // Standard icons sizes
  const sizes = [192, 256, 384, 512, 1024];
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
  }
  fs.copyFileSync('public/icon-192.png', 'public/favicon.png');
  
  console.log('Icons generated.');
}

fix().catch(console.error);
