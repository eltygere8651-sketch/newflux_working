const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

code = code.replace(/tStart = data\.trialStart \|\| null;/g, 'tStart = data.trialStart !== undefined ? data.trialStart : null;');
code = code.replace(/subEnd = data\.subscriptionEnd \|\| null;/g, 'subEnd = data.subscriptionEnd !== undefined ? data.subscriptionEnd : null;');

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Fixed falsy fallbacks');
