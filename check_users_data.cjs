const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: config.projectId });
}
const db = getFirestore(config.firestoreDatabaseId);

async function test() {
  console.log("Fetching users...");
  const snap = await db.collection("users").get();
  console.log(`Total users in Firestore: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`User ID: ${doc.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  DisplayName: ${data.displayName}`);
    console.log(`  CreatedAt: ${data.createdAt}`);
    console.log(`  Plan: ${data.plan}`);
    console.log(`  SubscriptionEnd: ${data.subscriptionEnd}`);
  });
}
test().catch(console.error);
