import admin from "firebase-admin";
import fs from "fs";
import { getFirestore } from "firebase-admin/firestore";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) : admin.credential.applicationDefault(),
    projectId: config.projectId,
  });
}
const db = config.firestoreDatabaseId ? getFirestore(config.firestoreDatabaseId) : getFirestore();

async function test() {
  const doc = await db.collection("app_settings").doc("explore_layout").get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
test().catch(console.error).finally(() => process.exit(0));
