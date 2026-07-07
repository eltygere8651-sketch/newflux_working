const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

async function run() {
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
  admin.initializeApp({ projectId: config.projectId });
  const db = getFirestore(config.firestoreDatabaseId);

  console.log("Checking explore_custom_playlists...");
  const community = await db.collection("explore_custom_playlists").get();
  console.log("Found", community.size, "community playlists");
  community.forEach(doc => {
    console.log(doc.id, "=>", doc.data().name);
  });

  console.log("\nChecking trial_requests...");
  const trials = await db.collection("trial_requests").get();
  console.log("Found", trials.size, "trial requests");

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
