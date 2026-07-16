const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  try {
    try {
      await admin.auth().deleteUser(userId);
    } catch (authErr) {`;

const replace = `  try {
    const db = getFirestoreDb(); // ensure admin is initialized
    try {
      await admin.auth().deleteUser(userId);
    } catch (authErr) {`;

code = code.replace(target, replace);

// Remove the duplicated getFirestoreDb()
const target2 = `    }
    const db = getFirestoreDb();
    if (db) {`;

const replace2 = `    }
    if (db) {`;

code = code.replace(target2, replace2);

fs.writeFileSync('server.ts', code);
