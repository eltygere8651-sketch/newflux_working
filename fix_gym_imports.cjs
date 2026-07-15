const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetImport = 'import { motion, AnimatePresence } from "motion/react";\nimport { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";\nimport { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";\nimport { auth, db } from "../lib/firebase";';
const replacementImport = 'import { motion, AnimatePresence } from "motion/react";\nimport { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";\nimport { auth } from "../lib/firebase";';

code = code.replace(targetImport, replacementImport);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
