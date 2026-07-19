
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Copying getFirestoreDb logic from server.ts
let isFirebaseAdminInitialized = false;

function getFirestoreDb() {
  console.log("DEBUG: getFirestoreDb called, isFirebaseAdminInitialized:", isFirebaseAdminInitialized);
  if (!isFirebaseAdminInitialized) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      console.log("DEBUG: configPath:", configPath);
      console.log("DEBUG: config file exists:", fs.existsSync(configPath));
      console.log("DEBUG: FIREBASE_SERVICE_ACCOUNT exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT);
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        console.log("DEBUG: config loaded, projectId:", config.projectId, "dbId:", config.firestoreDatabaseId);
        admin.initializeApp({
          credential: process.env.FIREBASE_SERVICE_ACCOUNT 
            ? admin.credential.cert(typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : process.env.FIREBASE_SERVICE_ACCOUNT) 
            : admin.credential.applicationDefault(),
          projectId: config.projectId,
        });
        console.log("DEBUG: admin.initializeApp successful");
        isFirebaseAdminInitialized = true;
        
        // Return db instance with dbId if exists
        return config.firestoreDatabaseId ? getFirestore(config.firestoreDatabaseId) : getFirestore();
      } else {
        console.error("DEBUG: firebase-applet-config.json NOT FOUND");
      }
    } catch (e) {
      console.error("Error initializing Firebase Admin:", e);
    }
  }
  return null;
}

async function diagnose() {
  console.log("Starting diagnostic...");
  const dbAdmin = getFirestoreDb();
  if (!dbAdmin) {
    console.log("DB not initialized.");
    return;
  }
  
  try {
    const fingerprint = 'test-fingerprint';
    console.log("Testing query...");
    const devDoc = await dbAdmin.collection("devices").doc(fingerprint).get();
    console.log("Query completed.");
  } catch (e) {
    console.error("Query failed:", e);
  }
}

diagnose();
