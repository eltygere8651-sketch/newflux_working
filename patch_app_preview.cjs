const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldEffect = `    const unsub2 = onSnapshot(qCards, (snap) => {`;
const newEffect = `    const handlePreview = () => {
      setShowOnboarding(true);
    };
    window.addEventListener("preview-onboarding", handlePreview);

    const unsub2 = onSnapshot(qCards, (snap) => {`;

content = content.replace(oldEffect, newEffect);

const oldCleanup = `    return () => { unsub1(); unsub2(); };`;
const newCleanup = `    return () => { unsub1(); unsub2(); window.removeEventListener("preview-onboarding", handlePreview); };`;

content = content.replace(oldCleanup, newCleanup);

const oldOnComplete = `        onComplete={() => {
          localStorage.setItem("flux_onboarding_version", onboardingVersion.toString());
          setShowOnboarding(false);
        }}`;

const newOnComplete = `        onComplete={() => {
          const completedVersion = parseInt(localStorage.getItem("flux_onboarding_version") || "0", 10);
          if (completedVersion < onboardingVersion) {
            localStorage.setItem("flux_onboarding_version", onboardingVersion.toString());
          }
          setShowOnboarding(false);
        }}`;

content = content.replace(oldOnComplete, newOnComplete);

fs.writeFileSync(path, content, 'utf8');
