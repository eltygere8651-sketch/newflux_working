const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-config.json");

if (!admin.apps.length) {
  try { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } catch (e) {}
}

const db = admin.firestore();
