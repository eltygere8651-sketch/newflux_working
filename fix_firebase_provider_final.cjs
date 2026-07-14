const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetLogic = `            let tStart = null;
            let subEnd = null;
            let planType = "none";
            let allowedUsers = 1;
            let activeSessionId = null;
            
            if (snapshot.exists()) {
              const data = snapshot.data();
              setDbUserProfile({
                displayName: data.displayName,
                photoURL: data.photoURL
              });
              tStart = data.trialStart || null;
              subEnd = data.subscriptionEnd || null;
              planType = data.plan || "none";
              allowedUsers = data.maxUsers || 1;
              activeSessionId = data.activeSessionId || null;
            }

            const now = Date.now();
            const msPerDay = 1000 * 60 * 60 * 24;

            let isValid = false;
            let daysRemaining = 0;

            if (u.email === "eltygere8651@gmail.com") {
              isValid = true;
              daysRemaining = 999;
            } else if (subEnd && subEnd > now) {
              isValid = true;
              daysRemaining = Math.max(0, Math.ceil((subEnd - now) / msPerDay));
            } else if (planType === "free" && tStart) {
              const trialEnd = tStart + 7 * msPerDay;
              if (trialEnd > now) {
                isValid = true;
                daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
              }
            }
            
            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            // Apply device trial ONLY if the user doesn't have an explicitly expired account trial or subscription
            const hasExplicitSub = subEnd !== null;
            const hasExplicitTrial = tStart !== null;
            const isSubExpired = hasExplicitSub && subEnd <= now;
            const isTrialExpired = hasExplicitTrial && (tStart + 7 * msPerDay) <= now;
            const isPlanNone = planType === 'none';
            const isVipAccount = u.email?.startsWith('vip_');

            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              const shouldApplyDeviceTrial = isVipAccount || (!isSubExpired && !isTrialExpired);
              
              if (shouldApplyDeviceTrial) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else if (!hasExplicitSub && !hasExplicitTrial) {
                  // Only force expiration from device trial if the user has no explicit trial/sub themselves
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

const replaceLogic = `            const isVipAccount = u.email?.startsWith('vip_');
            let tStart = null;
            let subEnd = null;
            let planType = isVipAccount ? "free" : "none";
            let allowedUsers = 1;
            let activeSessionId = null;
            
            if (snapshot.exists()) {
              const data = snapshot.data();
              setDbUserProfile({
                displayName: data.displayName,
                photoURL: data.photoURL
              });
              tStart = data.trialStart || null;
              subEnd = data.subscriptionEnd || null;
              planType = data.plan || (isVipAccount ? "free" : "none");
              allowedUsers = data.maxUsers || 1;
              activeSessionId = data.activeSessionId || null;
            }

            const now = Date.now();
            const msPerDay = 1000 * 60 * 60 * 24;

            let isValid = false;
            let daysRemaining = 0;

            if (u.email === "eltygere8651@gmail.com") {
              isValid = true;
              daysRemaining = 999;
            } else if (subEnd && subEnd > now) {
              isValid = true;
              daysRemaining = Math.max(0, Math.ceil((subEnd - now) / msPerDay));
            } else if (planType === "free" && tStart) {
              const trialEnd = tStart + 7 * msPerDay;
              if (trialEnd > now) {
                isValid = true;
                daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
              }
            }
            
            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            // Apply device trial ONLY if the user doesn't have an explicitly expired account trial or subscription
            const hasExplicitSub = subEnd !== null;
            const hasExplicitTrial = tStart !== null;
            const isSubExpired = hasExplicitSub && subEnd <= now;
            const isTrialExpired = hasExplicitTrial && (tStart + 7 * msPerDay) <= now;
            const isPlanNone = planType === 'none';

            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              const shouldApplyDeviceTrial = !isSubExpired && !isTrialExpired && !isPlanNone;
              
              if (shouldApplyDeviceTrial) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else if (!hasExplicitSub && !hasExplicitTrial) {
                  // Only force expiration from device trial if the user has no explicit trial/sub themselves
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

if (code.includes(targetLogic)) {
  code = code.replace(targetLogic, replaceLogic);
  fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
  console.log('Fixed FirebaseProvider logic perfectly');
} else {
  console.log('Target block not found');
}
