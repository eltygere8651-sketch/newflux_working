const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetLogic = `            let tStart = null;
            let subEnd = null;
            let planType = "free";
            let allowedUsers = 1;`;

const replaceLogic = `            let tStart = null;
            let subEnd = null;
            let planType = "none";
            let allowedUsers = 1;`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Fixed default plan type to none');
