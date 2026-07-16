const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

code = code.replace(
  'const snapshot = await getDoc(userRef);',
  ''
);

const targetDeviceLogic = `            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              // If the user has a valid subscription, don't override it.
              // Otherwise, we enforce the device's trial status.
              const hasActiveSub = hasExplicitSub && !isSubExpired;
              
              if (!hasActiveSub) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else {
                  // Device trial is EXPIRED!
                  // Enforce expiration so they can't request again.
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

const replacementDeviceLogic = `            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              // If the user already has an explicit expired subscription or explicitly expired trial on their account,
              // the account status takes precedence (they can't use a new device trial to bypass an expired account).
              const isAccountExpired = isSubExpired || isTrialExpired;
              const hasActiveSub = hasExplicitSub && !isSubExpired;
              
              if (!hasActiveSub && !isAccountExpired) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else {
                  // Device trial is EXPIRED!
                  // Enforce expiration so they can't request again.
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

code = code.replace(targetDeviceLogic, replacementDeviceLogic);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
