import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: config.projectId,
});

const db = getFirestore(admin.app(), config.firestoreDatabaseId);

db.collection("mail").add({
  to: "test@example.com",
  message: {
    subject: "Test",
    html: "Test"
  }
}).then(() => console.log("Success")).catch(e => console.error("Error:", e));
