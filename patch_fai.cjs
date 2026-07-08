const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex = /      const headers: Record<string, string> = \{\};[\s\S]*?      const res = await fetch\("\/api\/radio\/welcome", \{ headers \}\);/g;
code = code.replace(regex, '      const res = await fetch("/api/radio/welcome");');

fs.writeFileSync('src/components/FAIView.tsx', code);
