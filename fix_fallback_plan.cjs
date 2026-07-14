const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetLogic = `              planType = data.plan || "free";`;
const replaceLogic = `              planType = data.plan || "none";`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Fixed fallback plan type to none');
