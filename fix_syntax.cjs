const fs = require('fs');
const path = 'src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexToRemove = /  if \(annVideoUrl\.trim\(\)\) \{[\s\S]*?setIsPublishing\(false\);\n    \}\n  \};\n/m;

content = content.replace(regexToRemove, "");

fs.writeFileSync(path, content, 'utf8');
