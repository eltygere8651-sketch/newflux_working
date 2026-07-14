const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

code = code.replace(/const \{ updateDoc, doc \} = require\("firebase\/firestore"\);/g, '');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log('Fixed require');
