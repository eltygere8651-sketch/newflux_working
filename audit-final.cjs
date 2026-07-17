const fs = require('fs');
const crypto = require('crypto');

console.log("=== 3. index.html en producción (dist/index.html) ===");
const indexHtml = fs.readFileSync('dist/index.html', 'utf8');
const appleTouchLines = indexHtml.split('<').filter(tag => tag.includes('apple-touch-icon')).map(tag => '<' + tag.split('>')[0] + '>');
console.log(appleTouchLines.join('\n'));

console.log("\n=== 5. Favicons antiguos ===");
const allFiles = fs.readdirSync('dist');
console.log("Archivos ico/png en dist:");
console.log(allFiles.filter(f => f.endsWith('.ico') || f.endsWith('.png')));

console.log("\n=== 6. Manifest publicado ===");
const distManifest = fs.readFileSync('dist/manifest.json', 'utf8');
const publicManifest = fs.readFileSync('public/manifest.json', 'utf8');
console.log("¿El manifest de dist es idéntico al de public? ", distManifest === publicManifest);

console.log("\n=== 8. Comprobación byte por byte (dist vs public) ===");
const icons = [
  'apple-touch-icon.png',
  'apple-touch-icon-180.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-precomposed.png'
];

for (const icon of icons) {
  try {
    const distBuf = fs.readFileSync('dist/' + icon);
    const pubBuf = fs.readFileSync('public/' + icon);
    const distHash = crypto.createHash('sha256').update(distBuf).digest('hex');
    const pubHash = crypto.createHash('sha256').update(pubBuf).digest('hex');
    console.log(`${icon}: match=${distHash === pubHash} | size=${distBuf.length} bytes`);
  } catch (e) {
    console.log(`Error checking ${icon}: ${e.message}`);
  }
}
