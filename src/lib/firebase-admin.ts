import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

let isFirebaseAdminInitialized = false;

export function getFirestoreDb() {
  if (!isFirebaseAdminInitialized) {
    try {
      const configPath = path.join(
        process.cwd(),
        "firebase-applet-config.json",
      );
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: process.env.FIREBASE_SERVICE_ACCOUNT 
              ? admin.credential.cert(typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : process.env.FIREBASE_SERVICE_ACCOUNT) 
              : admin.credential.applicationDefault(),
            projectId: config.projectId,
          });
        }
        isFirebaseAdminInitialized = true;
        const dbId = config.firestoreDatabaseId;
        if (dbId) {
          return getFirestore(dbId);
        }
      } else {
         if (admin.apps.length === 0) {
            admin.initializeApp();
         }
         isFirebaseAdminInitialized = true;
      }
    } catch (err) {
      console.error("Failed to initialize Firebase Admin:", err);
      return null;
    }
  }
  return getFirestore();
}
