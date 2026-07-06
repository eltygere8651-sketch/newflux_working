const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require('fs');

let isFirebaseAdminInitialized = false;
function getFirestoreDb() {
  if (!isFirebaseAdminInitialized) {
    try {
      const configPath = "firebase-applet-config.json";
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        admin.initializeApp({
          projectId: config.projectId,
        });
        isFirebaseAdminInitialized = true;
      }
    } catch (e) {
      console.error("Error initializing Firebase Admin in backend:", e);
    }
  }

  if (isFirebaseAdminInitialized) {
    try {
      const configPath = "firebase-applet-config.json";
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const dbId = config.firestoreDatabaseId;
        if (dbId) {
          return getFirestore(dbId);
        } else {
          return getFirestore();
        }
      }
    } catch (e) {
      console.error("Error getting Firestore instance:", e);
      return null;
    }
  }
  return null;
}

const db = getFirestoreDb();
if (db) {
  db.collectionGroup("playlists").limit(1).get()
    .then(snap => {
       console.log("Docs:", snap.docs.length);
       process.exit(0);
    })
    .catch(err => {
       console.error("Error:", err);
       process.exit(1);
    });
} else {
  console.log("No DB");
}
