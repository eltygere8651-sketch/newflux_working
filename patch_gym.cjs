const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '(accessData && accessData.trialStart)',
  '(accessData && accessData.trialStart !== null)'
);

code = code.replace(
  '{accessData.plan === "none" && !accessData.trialStart',
  '{accessData.plan === "none" && accessData.trialStart === null'
);
code = code.replace(
  '{accessData.plan === "none" && !accessData.trialStart',
  '{accessData.plan === "none" && accessData.trialStart === null'
);
code = code.replace(
  '{accessData.plan === "none" && !accessData.trialStart',
  '{accessData.plan === "none" && accessData.trialStart === null'
);

code = code.replace(
  '{!((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) && !(accessData.plan !== "none" && accessData.plan !== "free") && (',
  '{!((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart !== null) && !(accessData.plan !== "none" && accessData.plan !== "free") && ('
);

code = code.replace(
  '{( ((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) || (accessData.plan !== "none" && accessData.plan !== "free") || (trialRequestStatus !== "idle" && !isCheckingTrialRequest) ) && (',
  '{( ((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart !== null) || (accessData.plan !== "none" && accessData.plan !== "free") || (trialRequestStatus !== "idle" && !isCheckingTrialRequest) ) && ('
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
