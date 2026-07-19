import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

let isFirebaseAdminInitialized = false;
let dbInstance: admin.firestore.Firestore | null = null;

export function getFirestoreDb() {
  if (dbInstance) return dbInstance;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let projectId: string | undefined = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    let databaseId: string | undefined = undefined;

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      projectId = config.projectId || projectId;
      databaseId = config.firestoreDatabaseId;
    }

    if (admin.apps.length === 0) {
      console.log(`[FIREBASE_ADMIN] Initializing Firebase Admin app...`);
      try {
        let credential;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          console.log(`[FIREBASE_ADMIN] Found FIREBASE_SERVICE_ACCOUNT env var.`);
          try {
            const cert = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
              ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
              : process.env.FIREBASE_SERVICE_ACCOUNT;
            credential = admin.credential.cert(cert);
            console.log(`[FIREBASE_ADMIN] Service account parsed successfully.`);
          } catch (parseErr: any) {
            console.error(`[FIREBASE_ADMIN] FAILED to parse FIREBASE_SERVICE_ACCOUNT JSON: ${parseErr.message}`);
            // Fallback to applicationDefault if possible
            credential = admin.credential.applicationDefault();
          }
        } else {
          console.log(`[FIREBASE_ADMIN] No FIREBASE_SERVICE_ACCOUNT found, using applicationDefault()`);
          credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
          credential,
          projectId: projectId,
        });
        console.log(`[FIREBASE_ADMIN] Initialized with Project: ${projectId}`);
      } catch (initErr: any) {
        console.error(`[FIREBASE_ADMIN] Error in admin.initializeApp: ${initErr.message}`);
        // If it still fails, we might just have to throw or return null
        throw initErr;
      }
    }

    if (databaseId) {
      try {
        dbInstance = getFirestore(databaseId);
        console.log(`[FIREBASE_ADMIN] Using named database: ${databaseId}`);
      } catch (e: any) {
        console.warn(`[FIREBASE_ADMIN] Could not connect to database ${databaseId}: ${e.message}. Falling back to default.`);
        dbInstance = getFirestore();
      }
    } else {
      dbInstance = getFirestore();
      console.log(`[FIREBASE_ADMIN] Using default database`);
    }

    isFirebaseAdminInitialized = true;
  } catch (err: any) {
    console.error("[FIREBASE_ADMIN] Critical initialization error:", err);
    try {
      if (admin.apps.length === 0) admin.initializeApp();
      dbInstance = getFirestore();
      isFirebaseAdminInitialized = true;
    } catch (finalErr) {
      console.error("[FIREBASE_ADMIN] Final fallback failed:", finalErr);
      return null;
    }
  }

  return dbInstance;
}
