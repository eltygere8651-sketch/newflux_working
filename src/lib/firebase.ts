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
  linkWithCredential,
  signInWithCustomToken
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

    const [
      oldUserSnap, newUserSnap,
      oldPlaylistsSnap, newPlaylistsSnap
    ] = await Promise.all([
      getDoc(oldUserRef), getDoc(newUserRef),
      getDocs(oldPlaylistsRef), getDocs(newPlaylistsRef)
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
  const user = auth.currentUser;
  const isGuestVip = user && (user.email?.startsWith('socio.') || user.email?.startsWith('vip_'));
  const oldUid = isGuestVip ? user.uid : null;

  try {
    if (user && user.isAnonymous) {
      try {
        await linkWithPopup(user, googleProvider);
        return; // Success, user is linked and has the same UID
      } catch (err: any) {
        if (err.code === 'auth/credential-already-in-use') {
          const cred = GoogleAuthProvider.credentialFromError(err);
          if (cred) {
            const anonymousOldUid = user.uid;
            const newCredUser = await signInWithCredential(auth, cred);
            await migrateGuestData(anonymousOldUid, newCredUser.user.uid);
            return;
          }
        }
        throw err;
      }
    }
    // 1. Try signInWithPopup first (extremely compatible with standalone mobile browsers, safari, etc.)
    const cred = await signInWithPopup(auth, googleProvider);
    if (oldUid && cred.user.uid !== oldUid) {
      await migrateGuestData(oldUid, cred.user.uid);
    }
  } catch (error: any) {
    console.warn("Popup authentication failed, trying redirect fallback:", error);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    
    // Only try redirect if it's not a domain unauthorized error, because redirect will also fail
    if (error?.code !== "auth/unauthorized-domain") {
      try {
        const currentUser = auth.currentUser;
        if (currentUser && (currentUser.isAnonymous || currentUser.email?.startsWith('socio.') || currentUser.email?.startsWith('vip_'))) {
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
    const isGuest = auth.currentUser?.isAnonymous || auth.currentUser?.email?.startsWith('socio.') || auth.currentUser?.email?.startsWith('vip_');
    const oldUid = auth.currentUser && isGuest ? auth.currentUser.uid : null;
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
    const isVipGuest = currentUser?.email?.startsWith('socio.') || currentUser?.email?.startsWith('vip_');
    const oldUid = currentUser ? currentUser.uid : null;

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
      if (oldUid && isVipGuest && oldUid !== user.uid) {
        await migrateGuestData(oldUid, user.uid);
      }
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

export const logout = () => {
  localStorage.setItem('flux_voluntary_logout', 'true');
  return signOut(auth);
};
export { signInAnonymously, signInWithCustomToken };

// Evercookie helpers for device persistence
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, val: string) => {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + (3650 * 24 * 60 * 60 * 1000)); // 10 years
  document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Strict`;
};

export const generateDeviceHash = async () => {
  const w = window.screen.width || 0;
  const h = window.screen.height || 0;
  const screenRes = Math.max(w, h) + 'x' + Math.min(w, h);
  
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  if (ua.indexOf('Linux') !== -1) os = 'Linux';
  if (ua.indexOf('Android') !== -1) os = 'Android';
  if (ua.indexOf('like Mac') !== -1) os = 'iOS';
  
  let canvasFingerprint = '';
  let webglFingerprint = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('flux,music,vip', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('flux,music,vip', 4, 17);
      canvasFingerprint = canvas.toDataURL();
    }

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglFingerprint = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '|' + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {}

  // Sincronizar un identificador persistente de alta entropía (Evercookie)
  let persistentId = '';
  try {
    persistentId = localStorage.getItem('flux_persistent_id') || '';
    if (!persistentId) {
      persistentId = getCookie('flux_persistent_id') || '';
    }
    if (!persistentId) {
      persistentId = 'flux_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    }
    localStorage.setItem('flux_persistent_id', persistentId);
    setCookie('flux_persistent_id', persistentId);
  } catch (e) {
    console.warn("No se pudo persistir el identificador local:", e);
  }
  
  const components = [
    persistentId,
    os,
    screenRes,
    window.screen.colorDepth || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
    navigator.maxTouchPoints || 0,
    canvasFingerprint,
    webglFingerprint
  ].join('|');
  
  const msgBuffer = new TextEncoder().encode(components);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const generateHardwareSignature = async () => {
  const w = window.screen.width || 0;
  const h = window.screen.height || 0;
  const screenRes = Math.max(w, h) + 'x' + Math.min(w, h);
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  if (ua.indexOf('Linux') !== -1) os = 'Linux';
  if (ua.indexOf('Android') !== -1) os = 'Android';
  if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  let webglFingerprint = '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglFingerprint = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '|' + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {}

  const components = [
    os,
    screenRes,
    window.screen.colorDepth || 0,
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
    webglFingerprint
  ].join('|');
  
  const msgBuffer = new TextEncoder().encode(components);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

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

