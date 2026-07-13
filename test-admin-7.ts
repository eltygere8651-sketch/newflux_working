import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "352265948901",
});

const db = getFirestore(config.firestoreDatabaseId);

db.collection("mail").limit(1).get().then(snap => console.log("Success:", snap.size)).catch(e => console.error("Error:", e.message));
