import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId,
});
// in some versions of firebase-admin, you pass databaseId in initializeApp
const db = getFirestore(app, config.firestoreDatabaseId);
console.log(db.databaseId);
db.collection("mail").limit(1).get().then(snap => console.log("Success:", snap.size)).catch(e => console.error("Error:", e.message));
