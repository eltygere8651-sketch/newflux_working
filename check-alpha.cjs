const sharp = require('sharp');

async function checkAlpha() {
  const metadata = await sharp('public/apple-touch-icon.png').metadata();
  console.log("Channels:", metadata.channels);
  console.log("Has Alpha:", metadata.hasAlpha);
}

checkAlpha();
