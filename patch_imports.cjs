const fs = require('fs');
const path = 'src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("  Pencil,\n", "");

fs.writeFileSync(path, content, 'utf8');
