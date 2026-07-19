
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Mocking the getFirestoreDb function from server.ts to test it
let isFirebaseAdminInitialized = false;

function getFirestoreDb() {
  if (!isFirebaseAdminInitialized) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        admin.initializeApp({
          credential: process.env.FIREBASE_SERVICE_ACCOUNT 
            ? admin.credential.cert(typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : process.env.FIREBASE_SERVICE_ACCOUNT) 
            : admin.credential.applicationDefault(),
          projectId: config.projectId,
        });
        isFirebaseAdminInitialized = true;
      }
    } catch (e) {
      console.error("Error initializing Firebase Admin in backend:", e);
    }
  }
  if (isFirebaseAdminInitialized) {
    return getFirestore();
  }
  return null;
}

const db = getFirestoreDb();
console.log("DB initialized:", db !== null);
