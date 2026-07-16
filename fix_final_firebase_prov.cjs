const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

// Also make sure to properly handle subscriptionEnd
// We want to ensure that setting trialStart to 0 really expires the trial
code = code.replace(
  'const isTrialExpired = hasExplicitTrial && (tStart + trialDurationDays * msPerDay) <= now;',
  'const isTrialExpired = hasExplicitTrial && (tStart === 0 || (tStart + trialDurationDays * msPerDay) <= now);'
);

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
