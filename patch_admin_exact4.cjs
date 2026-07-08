const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const regex = /      if \(res\.ok && data\.valid\) \{[\s\S]*?    \}\n  \};\n\n/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
