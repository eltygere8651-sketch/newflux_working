const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf8');

code = code.replace(/      let uid;\n         const oldUid/g, "      let uid;\n      const hash = await generateDeviceHash();\n      if (!currentUser || currentUser.isAnonymous) {\n         const oldUid");

fs.writeFileSync('src/components/VIPLandingView.tsx', code);
