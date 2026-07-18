const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const target = "    await sendPasswordResetEmail(auth, email);\n  setPersistence,\n  browserLocalPersistence(auth, email);";
content = content.replace(target, "    await sendPasswordResetEmail(auth, email);");

fs.writeFileSync('src/lib/firebase.ts', content);
