const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

// If the regex above failed because of spaces...
content = content.replace(/await sendPasswordResetEmail\(auth, email\);.*browserLocalPersistence\(auth, email\);/g, 'await sendPasswordResetEmail(auth, email);');

fs.writeFileSync('src/lib/firebase.ts', content);
