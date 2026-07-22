const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf8');
code = code.replace(
/             const isInternal = auth\.currentUser\.email\?\.startsWith\("socio\."\);\s*if \(auth\.currentUser\.isAnonymous\) \{\s*await createUserWithEmailAndPassword\(auth, email, password\);\s*const cred = EmailAuthProvider\.credential\(email, password\);\s*await linkWithCredential\(auth\.currentUser, cred\);\s*\} else if \(isInternal\) \{\s*await updateEmail\(auth\.currentUser, email\);\s*await updatePassword\(auth\.currentUser, password\);\s*\} else \{\s*\/\/ In case it's already another provider or normal email, try link \(will fail if already email\)\s*const cred = EmailAuthProvider\.credential\(email, password\);\s*await linkWithCredential\(auth\.currentUser, cred\);\s*\}/,
'             await createUserWithEmailAndPassword(auth, email, password);'
);
fs.writeFileSync('src/components/VIPLandingView.tsx', code);
