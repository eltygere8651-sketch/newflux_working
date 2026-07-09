const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  'return saved !== null ? parseInt(saved, 10) : 30;',
  'return saved !== null ? parseInt(saved, 10) : 32;'
);

code = code.replace(
  'return saved !== null ? parseInt(saved, 10) : 20;',
  'return saved !== null ? parseInt(saved, 10) : 18;'
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated FAIView.tsx default ratios");
