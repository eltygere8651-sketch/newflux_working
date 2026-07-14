import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);

const db = initializeFirestore(app, {}, config.firestoreDatabaseId);
const auth = getAuth(app);

async function run() {
  try {
    const deviceHash = "test_device_hash_strict_1";
    const uuid = "test_device_uuid_strict_1";
    
    console.log("== 1. Checking Device Hash ==");
    const hashRef = doc(db, 'vip_devices', deviceHash);
    const hashDoc = await getDoc(hashRef);
    
    if (hashDoc.exists()) {
      console.log("Este dispositivo ya ha utilizado su prueba gratuita de 7 días.");
      process.exit(1);
    }

    console.log("== 2. Anonymous Sign In ==");
    const userCred = await signInAnonymously(auth);
    const uid = userCred.user.uid;
    console.log(`Signed in anonymously. UID: ${uid}`);
    
    const now = Date.now();

    console.log("== 3. Register permanent hash lock ==");
    await setDoc(hashRef, { activatedAt: now, uid: uid });
    console.log("Registered hash lock.");

    console.log("== 4. Register VIP activation for stats ==");
    await setDoc(doc(db, 'vip_activations', uid), {
      uuid,
      deviceHash,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      version: 4,
      status: 'active',
      campaignId: null
    });
    console.log("Registered activation.");

    console.log("== 5. Set User Profile ==");
    await setDoc(doc(db, "users", uid), {
      email: `vip_${uid.substring(0, 8)}@flux.local`,
      displayName: "Socio VIP",
      isVIPGuest: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      lastActiveAt: now,
      totalUsageTime: 0,
      plan: "free",
      trialStart: now,
      maxUsers: 1,
      originCampaign: null,
    }, { merge: true });
    console.log("Set user profile.");

  } catch (e) {
    console.error("Error during flow:", e);
  }
  process.exit(0);
}
run();
