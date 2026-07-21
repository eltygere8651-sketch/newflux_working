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
  getDocs
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



export const loginWithGoogle = async () => {
  const user = auth.currentUser;

  try {
    if (user && user.isAnonymous) {
      try {
        await linkWithPopup(user, googleProvider);
        return; // Success, user is linked and has the same UID
      } catch (err: any) {
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
    const cred = await signInWithEmailAndPassword(auth, email, pass);
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
         throw linkError;
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

export const logout = () => {
  localStorage.setItem('flux_voluntary_logout', 'true');
  return signOut(auth);
};
export { signInAnonymously };

// Handle redirect result on load
getRedirectResult(auth)
  .then(async (result) => {
    if (result) {
      console.log("Redirect sign-in successful style", result.user.email);
    }
  })
  .catch(async (error) => {
    sessionStorage.removeItem('flux_migration_old_uid');
    console.warn("Redirect error on load:", error.code || error.message);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
  });

