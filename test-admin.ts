import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
admin.initializeApp({ 
  credential: admin.credential.applicationDefault(),
  projectId: config.projectId 
});
const db = getFirestore(config.firestoreDatabaseId || "(default)");

db.collection("mail").add({ to: "test_admin@example.com", message: { subject: "Test", html: "Test" } }).then(doc => console.log("Success:", doc.id)).catch(e => console.error("Error:", e.message));
