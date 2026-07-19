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
  console.log("Fetching users...");
  const snap = await db.collection("users").get();
  console.log(`Total users in Firestore: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`User ID: ${doc.id}, Email: ${doc.data().email}, CreatedAt: ${doc.data().createdAt}, Plan: ${doc.data().plan}, SubscriptionEnd: ${doc.data().subscriptionEnd}`);
  });
}
test().catch(console.error).finally(() => process.exit(0));
