import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);

const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function run() {
  try {
    const deviceHash = "test_device_hash_strict_1";
    // Try to overwrite the existing hash
    await setDoc(doc(db, 'vip_devices', deviceHash), { hacked: true });
    console.log("Hacked successfully!");
  } catch (e) {
    console.log("Hack failed:", e.message);
  }
  process.exit(0);
}
run();
