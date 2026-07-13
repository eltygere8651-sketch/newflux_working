import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

db.collection("mail").add({ to: "test@example.com" }).then(() => console.log("Success")).catch(e => console.error("Error:", e));
