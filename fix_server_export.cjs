const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/async function startServer\(\) \{/g, 'export { app };\nasync function startServer() {');
code = code.replace(/startServer\(\);/g, 'if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {\n  startServer();\n}');
fs.writeFileSync('server.ts', code);
