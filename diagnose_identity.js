
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function diagnose() {
  console.log("--- STARTING IDENTITY DIAGNOSIS ---");

  // 1. Config
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("ProjectId:", config.projectId);
  console.log("DatabaseId:", config.firestoreDatabaseId || "(default)");

  // 2. Env Vars
  console.log("FIREBASE_SERVICE_ACCOUNT exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("GOOGLE_APPLICATION_CREDENTIALS exists:", !!process.env.GOOGLE_APPLICATION_CREDENTIALS);

  // 3. Credential Source & Initialization
  let credentialSource = "Unknown";
  let credentialObject = null;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credentialSource = "FIREBASE_SERVICE_ACCOUNT";
      const sa = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      credentialObject = admin.credential.cert(sa);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credentialSource = "GOOGLE_APPLICATION_CREDENTIALS";
      // This is harder to inspect without loading the file, but we know it's being used
      credentialObject = admin.credential.applicationDefault();
    } else {
      credentialSource = "Application Default Credentials (ADC)";
      credentialObject = admin.credential.applicationDefault();
    }
    
    console.log("Credential Source Identified:", credentialSource);

    // Try to extract client email if it's a cert
    if (credentialSource === "FIREBASE_SERVICE_ACCOUNT") {
       const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
       console.log("Client Email:", sa.client_email);
    }

    admin.initializeApp({
      credential: credentialObject,
      projectId: config.projectId,
    });
    console.log("admin.initializeApp() called successfully.");

  } catch (e) {
    console.error("admin.initializeApp() FAILED:", e);
    return; // Cannot proceed
  }

  // 4. Firestore Access
  const app = admin.app();
  const db = config.firestoreDatabaseId 
    ? getFirestore(app, config.firestoreDatabaseId) 
    : getFirestore(app);

  console.log("Firestore instance created. Attempting read on 'users' collection...");

  try {
    const snapshot = await db.collection("users").limit(1).get();
    console.log("SUCCESS: Read collection 'users' (size: " + snapshot.size + ")");
  } catch (error) {
    console.error("--- FIRESTORE READ FAILED ---");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
  }

  console.log("--- ENDING IDENTITY DIAGNOSIS ---");
}

diagnose();
