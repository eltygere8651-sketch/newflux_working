import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

// Load config
const configPath = "./firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase
const app = initializeApp(config);
const db = getFirestore(app);

async function clean() {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  
  let deletedCount = 0;
  
  const now = Date.now();
  
  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    
    const displayName = data.displayName;
    const email = data.email || "";
    
    let isActive = false;
    let isFinishedTrial = false;
    
    if (email === "eltygere8651@gmail.com") {
      isActive = true;
    } else if (data.subscriptionEnd && data.subscriptionEnd > now) {
      isActive = true;
    } else if (data.plan === "free" && data.trialStart !== undefined && data.trialStart !== null) {
      if (data.trialStart === 0) {
          isFinishedTrial = true;
      } else {
        const trialDurationDays = data.trialDuration || 7;
        const trialEnd = data.trialStart + trialDurationDays * 24 * 60 * 60 * 1000;
        if (now < trialEnd) {
          isActive = true;
        } else {
            isFinishedTrial = true; // Trial expired
        }
      }
    }
    
    // Condition to delete: no name AND no access
    const noName = !displayName || displayName.trim() === "";
    const noAccess = !isActive;
    
    if (noName && noAccess) {
      console.log(`Deleting user ${userDoc.id} - name: ${displayName}, email: ${email}, isActive: ${isActive}`);
      await deleteDoc(userDoc.ref);
      await deleteDoc(doc(db, "trial_requests", userDoc.id)).catch(() => {});
      await deleteDoc(doc(db, "vip_activations", userDoc.id)).catch(() => {});
      
      deletedCount++;
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} accounts.`);
  process.exit(0);
}

clean();
