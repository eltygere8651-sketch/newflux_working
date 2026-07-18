const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const oldStr = `  try {
    await sendPasswordResetEmail(auth, email);  setPersistence,  browserLocalPersistence(auth, email);
  } catch`;

const newStr = `  try {
    await sendPasswordResetEmail(auth, email);
  } catch`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/lib/firebase.ts', content);
