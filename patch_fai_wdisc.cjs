const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `const wDisc = total > 0 ? discRatio / total : 0.40;`;
const replacement = `const wDisc = total > 0 ? discRatio / total : 0.15;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched wDisc successfully");
} else {
  console.log("Target wDisc not found!");
}
