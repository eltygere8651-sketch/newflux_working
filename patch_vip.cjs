const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf8');

const replacement = `      // If we reach here, they are either not signed in, or they are signed in but don't have a trialStart yet.
      let uid;
      const hash = await generateDeviceHash();
      if (!currentUser || currentUser.isAnonymous) {
         const oldUid = currentUser ? currentUser.uid : null;
         const internalEmail = \`socio.\${hash.substring(0, 6)}@fluxmusic.com\`;
         const internalPass = \`\${hash.substring(0, 10)}_fluxvip\`;
            
         let userCred;
         try {
             userCred = await signInWithEmailAndPassword(auth, internalEmail, internalPass);
         } catch (e) {
             userCred = await createUserWithEmailAndPassword(auth, internalEmail, internalPass);
         }
         uid = userCred.user.uid;
            
         if (oldUid && oldUid !== uid) {`;

code = code.replace(/      \/\/ If we reach here, they are either not signed in, or they are signed in but don't have a trialStart yet\.\n      let uid;\n         const oldUid = currentUser \? currentUser\.uid : null;\n         const internalEmail = `socio\.\$\{hash\.substring\(0, 6\)\}@fluxmusic\.com`;\n         const internalPass = `\$\{hash\.substring\(0, 10\)\}_fluxvip`;\n            \n         let userCred;\n         try \{\n             userCred = await signInWithEmailAndPassword\(auth, internalEmail, internalPass\);\n         \} catch \(e\) \{\n             userCred = await createUserWithEmailAndPassword\(auth, internalEmail, internalPass\);\n         \}\n         uid = userCred\.user\.uid;\n            \n         if \(oldUid && oldUid !== uid\) \{/g, replacement);

fs.writeFileSync('src/components/VIPLandingView.tsx', code);
