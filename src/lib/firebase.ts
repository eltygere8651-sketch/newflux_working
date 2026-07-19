import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  linkWithPopup,
  signInWithCredential,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence Firestore network connection warnings
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const googleProvider = new GoogleAuthProvider();

// Custom global error storage/callback to let UI know about redirect/popup errors
type AuthErrorCallback = (err: any) => void;
let onAuthErrorCallback: AuthErrorCallback | null = null;

export const registerAuthErrorHandler = (callback: AuthErrorCallback) => {
  onAuthErrorCallback = callback;
};

let isMigrating = false;

export const migrateGuestData = async (oldUid: string, newUid: string) => {
  if (!oldUid || !newUid || oldUid === newUid) return;
  if (isMigrating) return;
  isMigrating = true;

  const lockRef = doc(db, "migration_locks", oldUid);

  try {
    const lockAcquired = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);
      const now = Date.now();
      if (lockDoc.exists()) {
        const lockData = lockDoc.data();
        if (lockData.lockedAt && now - lockData.lockedAt < 5 * 60 * 1000) {
          return false; // Migration already in progress within the last 5 minutes
        }
      }
      transaction.set(lockRef, { lockedAt: now });
      return true;
    });

    if (!lockAcquired) {
      console.log("Migration is already in progress for this user.");
      return;
    }

    type DBWrite = { type: 'set', ref: any, data: any, options?: any } | { type: 'update', ref: any, data: any };
    type DBDelete = { type: 'delete', ref: any };
    
    const writes: DBWrite[] = [];
    const deletes: DBDelete[] = [];

    // Phase 1: All Reads (Memory Only, completely non-destructive)
    const oldUserRef = doc(db, "users", oldUid);
    const newUserRef = doc(db, "users", newUid);
    const oldPlaylistsRef = collection(db, "users", oldUid, "playlists");
    const newPlaylistsRef = collection(db, "users", newUid, "playlists");
    const oldTrialRef = doc(db, "trial_requests", oldUid);
    const oldVipRef = doc(db, "vip_activations", oldUid);
    const newVipRef = doc(db, "vip_activations", newUid);
    const messagesQ = query(collection(db, "support_messages"), where("userId", "==", oldUid));

    const [
      oldUserSnap, newUserSnap,
      oldPlaylistsSnap, newPlaylistsSnap,
      oldTrialSnap,
      oldVipSnap, newVipSnap,
      messagesSnap
    ] = await Promise.all([
      getDoc(oldUserRef), getDoc(newUserRef),
      getDocs(oldPlaylistsRef), getDocs(newPlaylistsRef),
      getDoc(oldTrialRef),
      getDoc(oldVipRef), getDoc(newVipRef),
      getDocs(messagesQ)
    ]);

    // 1. users
    if (oldUserSnap.exists()) {
       const dataToMerge = oldUserSnap.data() as any;
       if (newUserSnap.exists()) {
           const newData = newUserSnap.data() as any;
           // Do not downgrade premium users
           if (newData.plan === 'premium' && dataToMerge.plan === 'free') {
               delete dataToMerge.plan;
               delete dataToMerge.trialStart;
               delete dataToMerge.isVIPGuest;
           }
           // Do not overwrite existing settings/preferences
           if (newData.displayName) delete dataToMerge.displayName;
           if (newData.photoURL) delete dataToMerge.photoURL;
           if (newData.email) delete dataToMerge.email;
           if (newData.theme !== undefined) delete dataToMerge.theme;
           if (newData.language !== undefined) delete dataToMerge.language;
       }
       writes.push({ type: 'set', ref: newUserRef, data: dataToMerge, options: { merge: true } });
       deletes.push({ type: 'delete', ref: oldUserRef });
    }

    // 2. users/{uid}/playlists
    const newPlaylists = newPlaylistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    for (const p of oldPlaylistsSnap.docs) {
       const oldData = p.data();
       let targetDocRef = doc(newPlaylistsRef, p.id);
       let targetDataToSet = oldData;

       // Merge "Favoritos" specifically to prevent duplicates
       if (oldData.name?.toLowerCase() === "favoritos") {
         const existingFav = newPlaylists.find((np: any) => np.name?.toLowerCase() === "favoritos");
         if (existingFav) {
           targetDocRef = doc(newPlaylistsRef, existingFav.id);
           const oldTracks = Array.isArray(oldData.tracks) ? oldData.tracks : [];
           const newTracks = Array.isArray((existingFav as any).tracks) ? (existingFav as any).tracks : [];
           
           // Deduplicate tracks by id
           const trackMap = new Map();
           newTracks.forEach((t: any) => { if (t.id) trackMap.set(t.id, t); });
           oldTracks.forEach((t: any) => { if (t.id && !trackMap.has(t.id)) trackMap.set(t.id, t); });
           
           targetDataToSet = { ...oldData, tracks: Array.from(trackMap.values()) };
         }
       }
       writes.push({ type: 'set', ref: targetDocRef, data: targetDataToSet, options: { merge: true } });
       deletes.push({ type: 'delete', ref: p.ref });
    }

    // 3. trial_requests
    if (oldTrialSnap.exists()) {
       writes.push({ type: 'set', ref: doc(db, "trial_requests", newUid), data: oldTrialSnap.data(), options: { merge: true } });
       deletes.push({ type: 'delete', ref: oldTrialSnap.ref });
    }

    // 4. vip_activations
    if (oldVipSnap.exists()) {
       let shouldMerge = true;
       if (newVipSnap.exists()) {
           const oldExpires = oldVipSnap.data().expiresAt || 0;
           const newExpires = newVipSnap.data().expiresAt || 0;
           if (newExpires >= oldExpires) {
               shouldMerge = false;
           }
       }
       if (shouldMerge) {
           writes.push({ type: 'set', ref: newVipRef, data: oldVipSnap.data(), options: { merge: true } });
       }
       deletes.push({ type: 'delete', ref: oldVipSnap.ref });
    }

    // 5. support_messages
    for (const m of messagesSnap.docs) {
       writes.push({ type: 'update', ref: m.ref, data: { userId: newUid } });
    }

    // Helper: Execute ops in safely chunked batches
    const executeChunks = async (ops: (DBWrite | DBDelete)[]) => {
      for (let i = 0; i < ops.length; i += 490) {
        const chunk = ops.slice(i, i + 490);
        const b = writeBatch(db);
        for (const op of chunk) {
          if (op.type === 'set') b.set(op.ref, op.data, op.options);
          else if (op.type === 'update') b.update(op.ref, op.data);
          else if (op.type === 'delete') b.delete(op.ref);
        }
        await b.commit();
      }
    };

    // Phase 2: All Sets/Updates (Chunked Copying Phase)
    // Note: Firestore doesn't guarantee atomicity across multiple batches.
    if (writes.length > 0) {
      await executeChunks(writes);
    }
    
    // Phase 3: All Deletes (Only executes if all copying succeeded)
    if (deletes.length > 0) {
      await executeChunks(deletes);
    }
  } catch (error) {
    console.error("Migration error:", error);
    // Logging only to ensure UI flows don't crash from inconsistent network.
  } finally {
    try {
      await deleteDoc(lockRef);
    } catch (e) {
      console.warn("Failed to clear migration lock:", e);
    }
    isMigrating = false;
  }
};

export const loginWithGoogle = async () => {
  try {
    const user = auth.currentUser;
    if (user && user.isAnonymous) {
      try {
        await linkWithPopup(user, googleProvider);
        return; // Success, user is linked and has the same UID
      } catch (err: any) {
        if (err.code === 'auth/credential-already-in-use') {
          const cred = GoogleAuthProvider.credentialFromError(err);
          if (cred) {
            const oldUid = user.uid;
            const newCredUser = await signInWithCredential(auth, cred);
            await migrateGuestData(oldUid, newCredUser.user.uid);
            return;
          }
        }
        throw err;
      }
    }
    // 1. Try signInWithPopup first (extremely compatible with standalone mobile browsers, safari, etc.)
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn("Popup authentication failed, trying redirect fallback:", error);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    
    // Only try redirect if it's not a domain unauthorized error, because redirect will also fail
    if (error?.code !== "auth/unauthorized-domain") {
      try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
          sessionStorage.setItem('flux_migration_old_uid', currentUser.uid);
        }
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError: any) {
        console.warn("Redirect login selection failed:", redirectError.code || redirectError.message);
        if (onAuthErrorCallback) {
          onAuthErrorCallback(redirectError);
        }
      }
    }
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const oldUid = auth.currentUser && auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (oldUid && oldUid !== cred.user.uid) {
      await migrateGuestData(oldUid, cred.user.uid);
    }
    return cred.user;
  } catch (error: any) {
    console.warn("Email login failed:", error.code || error.message);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    throw error;
  }
};

export const signupWithEmail = async (email: string, pass: string, nickname?: string) => {
  try {
    let user;
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.isAnonymous) {
      const cred = EmailAuthProvider.credential(email, pass);
      try {
        const linkResult = await linkWithCredential(currentUser, cred);
        user = linkResult.user;
      } catch (linkError: any) {
        if (linkError.code === 'auth/email-already-in-use') {
           const loginCred = await signInWithEmailAndPassword(auth, email, pass);
           await migrateGuestData(currentUser.uid, loginCred.user.uid);
           user = loginCred.user;
        } else {
           throw linkError;
        }
      }
    } else {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      user = cred.user;
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nickname || email || user.uid)}`;
    await updateProfile(user, { 
      displayName: nickname || "Usuario", 
      photoURL: defaultAvatar 
    });
    return user;
  } catch (error: any) {
    console.warn("Email registration failed:", error.code || error.message);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.warn("Password reset error:", error.code || error.message);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);
export { signInAnonymously };

// Handle redirect result on load
getRedirectResult(auth)
  .then(async (result) => {
    if (result) {
      console.log("Redirect sign-in successful style", result.user.email);
      const oldUid = sessionStorage.getItem('flux_migration_old_uid');
      if (oldUid && oldUid !== result.user.uid) {
        try {
          await migrateGuestData(oldUid, result.user.uid);
        } catch (e) {
          console.error("Failed to migrate guest data after redirect", e);
        }
      }
      sessionStorage.removeItem('flux_migration_old_uid');
    }
  })
  .catch(async (error) => {
    sessionStorage.removeItem('flux_migration_old_uid');
    console.warn("Redirect error on load:", error.code || error.message);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
  });

