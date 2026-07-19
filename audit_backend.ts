import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function audit() {
  console.log("Starting backend audit...");
  
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error("firebase-applet-config.json not found");
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    console.log("Config loaded:", { projectId: config.projectId, databaseId: config.firestoreDatabaseId });

    if (!admin.apps.length) {
      console.log("Initializing Firebase Admin...");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Use default, not service account env var
        projectId: config.projectId,
      });
    }

    const db = config.firestoreDatabaseId ? getFirestore(config.firestoreDatabaseId) : getFirestore();
    
    console.log("Firestore instance created. Testing access to 'users' collection...");
    
    const userDoc = await db.collection("users").limit(1).get();
    console.log("Successfully fetched users collection (count: " + userDoc.size + ")");
    
  } catch (error: any) {
    console.error("AUDIT FAILED:", error.message);
  }
}

audit();
