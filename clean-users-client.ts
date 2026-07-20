import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, initializeFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const auth = getAuth(app);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function clean() {
  await signInAnonymously(auth);
  console.log("Signed in anonymously");

  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  
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
      await deleteDoc(userDoc.ref);
      await deleteDoc(doc(db, "trial_requests", userDoc.id)).catch(() => {});
      await deleteDoc(doc(db, "vip_activations", userDoc.id)).catch(() => {});
      if (data.deviceHash) {
          await updateDoc(doc(db, "vip_devices", data.deviceHash), { activatedAt: 0 }).catch(() => {});
      }
      
      deletedCount++;
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} accounts.`);
  process.exit(0);
}

clean().catch(console.error);
