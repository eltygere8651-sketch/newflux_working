const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');
code = code.replace(
  'import { doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";',
  'import { doc, getDoc, setDoc, serverTimestamp, increment, onSnapshot } from "firebase/firestore";'
);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
