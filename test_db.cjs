const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-config.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection("users").get();
  console.log("Users in DB:");
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data().email, doc.data().plan);
  });
}
run();
