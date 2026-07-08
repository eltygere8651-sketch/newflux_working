const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const regex = /      const res = await fetch\("\/api\/radio\/test-voice", \{ headers \}\);[\s\S]*?      const data = await res\.json\(\);/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
