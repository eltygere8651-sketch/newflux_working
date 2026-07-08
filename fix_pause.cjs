const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(/          \/\/ fallback tts pause\/resume[\s\S]*?          \}/g, '');
fs.writeFileSync('src/components/FAIView.tsx', code);
