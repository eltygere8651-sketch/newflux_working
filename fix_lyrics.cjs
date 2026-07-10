const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    'if (!response.ok) {\n      throw new Error("Lrclib API error");\n    }',
    'if (!response.ok) {\n      console.error("Lrclib API error:", response.status, await response.text());\n      throw new Error("Lrclib API error");\n    }'
);

fs.writeFileSync('server.ts', code);
console.log("Updated error logging");
