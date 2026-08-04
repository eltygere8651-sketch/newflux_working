const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

code = code.replace(/    setTimeout\(\(\) => \{\n      if \(playerContainerRef\.current\) \{\n        playerContainerRef\.current\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);\n      \}\n    \}, 100\);/g, '');

fs.writeFileSync('src/components/VideoView.tsx', code);
console.log("Removed scrollIntoView");
