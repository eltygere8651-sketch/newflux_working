const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const regex1 = /        setElevenLabs[\s\S]*?conectar con el servidor"\);\n/g;
code = code.replace(regex1, '');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
