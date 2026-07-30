const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /onComplete=\{\(\) => \{\n          const completedVersion = parseInt\(localStorage\.getItem\("flux_onboarding_version"\) \|\| "0", 10\);\n          if \(completedVersion < onboardingVersion\) \{\n            localStorage\.setItem\("flux_onboarding_version", onboardingVersion\.toString\(\)\);\n          \}\n          setShowOnboarding\(false\);\n        \}\}/;

const newComplete = `onComplete={() => {
          try {
            const completedStr = localStorage.getItem("flux_onboarding_version");
            const completedVersion = completedStr ? parseInt(completedStr, 10) : 0;
            if (completedVersion < onboardingVersion) {
              localStorage.setItem("flux_onboarding_version", onboardingVersion.toString());
            }
          } catch(e) {
            console.error("Error saving onboarding state:", e);
          }
          setShowOnboarding(false);
        }}`;

if (content.match(regex)) {
  content = content.replace(regex, newComplete);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
