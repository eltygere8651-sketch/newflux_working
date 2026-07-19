const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace("export const logout = () => signOut(auth);", "export const logout = () => {\n  localStorage.setItem('flux_voluntary_logout', 'true');\n  return signOut(auth);\n};");
fs.writeFileSync('src/lib/firebase.ts', code);
