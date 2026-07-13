import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
console.log("DB ID:", config.firestoreDatabaseId);
admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

db.collection("users").limit(1).get().then(snap => console.log("Success:", snap.size)).catch(e => console.error("Error:", e.message));
