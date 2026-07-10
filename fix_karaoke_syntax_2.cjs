const fs = require('fs');
let code = fs.readFileSync('src/components/KaraokeView.tsx', 'utf8');

code = code.replace(
    /className=\{\`p-3 rounded-full transition-all \\\$\{showSettings \? 'bg-white\/20' : 'bg-white\/5 hover:bg-white\/10'\}\`\}/g,
    "className={`p-3 rounded-full transition-all ${showSettings ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}"
);

fs.writeFileSync('src/components/KaraokeView.tsx', code);
console.log("Fixed syntax error 2.");
