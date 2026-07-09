const fs = require('fs');
let code = fs.readFileSync('src/lib/djLogic.ts', 'utf8');

code = code.replace(
  'let topRatio = 30;',
  'let topRatio = 32;'
);

code = code.replace(
  'let favRatio = 20;',
  'let favRatio = 18;'
);

code = code.replace(
  'const wTop = total > 0 ? topRatio / total : 0.30;',
  'const wTop = total > 0 ? topRatio / total : 0.32;'
);

code = code.replace(
  'const wFav = total > 0 ? favRatio / total : 0.20;',
  'const wFav = total > 0 ? favRatio / total : 0.18;'
);

fs.writeFileSync('src/lib/djLogic.ts', code);
console.log("Updated djLogic.ts default ratios");
