import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

admin.initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) : admin.credential.applicationDefault(),
  projectId: config.projectId,
});

const dbId = config.firestoreDatabaseId;
const db = dbId ? getFirestore(dbId) : getFirestore();

async function clean() {
  const usersRef = db.collection("users");
  const snap = await usersRef.get();
  
  let deletedCount = 0;
  const now = Date.now();
  
  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    
    const displayName = data.displayName;
    const email = data.email || "";
    
    let isActive = false;
    
    if (email === "eltygere8651@gmail.com") {
      isActive = true;
    } else if (data.subscriptionEnd && data.subscriptionEnd > now) {
      isActive = true;
    } else if (data.plan === "free" && data.trialStart !== undefined && data.trialStart !== null) {
      if (data.trialStart !== 0) {
        const trialDurationDays = data.trialDuration || 7;
        const trialEnd = data.trialStart + trialDurationDays * 24 * 60 * 60 * 1000;
        if (now < trialEnd) {
          isActive = true;
        }
      }
    }
    
    const noName = !displayName || displayName.trim() === "";
    const noAccess = !isActive;
    
    if (noName && noAccess) {
      console.log(`Deleting user ${userDoc.id} - email: ${email}`);
      await userDoc.ref.delete();
      await db.collection("trial_requests").doc(userDoc.id).delete().catch(() => {});
      await db.collection("vip_activations").doc(userDoc.id).delete().catch(() => {});
      if (data.deviceHash) {
          await db.collection("vip_devices").doc(data.deviceHash).update({ activatedAt: 0 }).catch(() => {});
      }
      
      deletedCount++;
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} accounts.`);
}

clean().catch(console.error);
