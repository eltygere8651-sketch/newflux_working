const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace `src={someVar}` with `src={someVar || undefined}` where someVar could be empty string
  // It's easier to just find all `<img ... src={` and `<audio ... src={` and `<iframe ... src={`
  // But wait, there are too many.
  // How about we just fix the `cleanUrl`, `getTrackImage`, `getPlaylistImage`, `getItemImage` functions?
  
  // Let's modify cleanUrl to return undefined if no url
  content = content.replace(/if \(\!url\) return "";/g, 'if (!url) return undefined;');
  
  // Let's also do it for photoURL logic:
  // src={photoURL || `...`} is safe because if photoURL is "", it falls back to `...` which is a string.
  
  fs.writeFileSync(filepath, content);
}

patchFile('src/components/GymMusicPlayer.tsx');
patchFile('src/components/ExploreView.tsx');

// For LazyImage.tsx
let lazyImage = fs.readFileSync('src/components/LazyImage.tsx', 'utf8');
lazyImage = lazyImage.replace(
  'src={error ? (fallbackSrc || DEFAULT_MUSIC_COVER) : currentSrc}',
  'src={error ? (fallbackSrc || DEFAULT_MUSIC_COVER) : (currentSrc || undefined)}'
);
fs.writeFileSync('src/components/LazyImage.tsx', lazyImage);

