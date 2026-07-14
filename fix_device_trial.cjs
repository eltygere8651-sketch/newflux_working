const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetLogic = `const shouldApplyDeviceTrial = isVipAccount || (!isSubExpired && !isTrialExpired && !isPlanNone);`;
const replaceLogic = `const shouldApplyDeviceTrial = isVipAccount || (!isSubExpired && !isTrialExpired);`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Fixed shouldApplyDeviceTrial');
