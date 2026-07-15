const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const targetStatus = `                } else if (u.plan === "free" && u.trialStart) {
                   const trialDuration = u.trialDuration || 7;
                   const trialEnd = u.trialStart + trialDuration * msPerDay;
                   if (trialEnd > now) {
                     isActive = true;
                     statusText = \`Prueba \${trialDuration} días (\${Math.ceil((trialEnd - now)/msPerDay)} días)\`;
                   } else {
                     statusText = "Prueba finalizada";
                   }
                } else if (u.subscriptionEnd && u.subscriptionEnd < now) {
                   statusText = "Suscripción expirada";
                }`;

const replaceStatus = `                } else if (u.plan === "free" && u.trialStart !== undefined && u.trialStart !== null) {
                   if (u.trialStart === 0) {
                     statusText = "Prueba finalizada";
                   } else {
                     const trialDuration = u.trialDuration || 7;
                     const trialEnd = u.trialStart + trialDuration * msPerDay;
                     if (trialEnd > now) {
                       isActive = true;
                       statusText = \`Prueba \${trialDuration} días (\${Math.ceil((trialEnd - now)/msPerDay)} días)\`;
                     } else {
                       statusText = "Prueba finalizada";
                     }
                   }
                } else if (u.subscriptionEnd && u.subscriptionEnd < now) {
                   statusText = "Suscripción expirada";
                }`;

code = code.replace(targetStatus, replaceStatus);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log('Fixed admin status text');
