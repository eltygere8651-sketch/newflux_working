import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, signInAnonymously, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, increment, onSnapshot, collection, query, where, getDocs, limit } from "firebase/firestore";
import { auth, db, registerAuthErrorHandler } from "../lib/firebase";

export interface UserAccessData {
  trialStart: number | null; // Timestamp ms
  subscriptionEnd: number | null; // Timestamp ms
  plan: 'free' | '1mo' | '3mo' | '6mo' | '12mo' | null;
  isValid: boolean;
  daysRemaining: number;
  maxUsers: number;
  activeSessionId?: string | null;
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  authError: any | null;
  clearAuthError: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (val: boolean) => void;
  accessData: UserAccessData | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  isOnline: true,
  authError: null,
  clearAuthError: () => {},
  isAuthModalOpen: false,
  setAuthModalOpen: () => {},
  accessData: null,
});

export const useFirebase = () => useContext(FirebaseContext);


export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUserProfile, setDbUserProfile] = useState<{ displayName?: string, photoURL?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authError, setAuthError] = useState<any | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [accessData, setAccessData] = useState<UserAccessData | null>(null);
  const isAuthenticatingRef = useRef(false);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register error handler to catch popup and redirect failures
    registerAuthErrorHandler((error: any) => {
      console.warn("Caught authentication error in Provider:", error);
      setAuthError(error);
    });

    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!u) {
        setUser(null);

        if (localStorage.getItem('flux_voluntary_logout') === 'true') {
          setDbUserProfile(null);
          setAccessData(null);
          setLoading(false);
          return;
        }

        if (isAuthenticatingRef.current || (window as any).isFluxAuthenticating) {
          return;
        }
        
        isAuthenticatingRef.current = true;
        (window as any).isFluxAuthenticating = true;

        // Attempt to recover VIP session from device hash
        try {
            const { generateDeviceHash } = await import('../lib/deviceHash');
            const hash = await generateDeviceHash();
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(auth, `device_${hash}@fluxplay.cc`, `Flux-${hash}`);
            // If successful, onAuthStateChanged will fire again with the user!
            return;
        } catch (e) {
            // Do not create ghost anonymous users! Just stay unauthenticated.
            setDbUserProfile(null);
            setAccessData(null);
            setLoading(false);
        } finally {
            isAuthenticatingRef.current = false;
            (window as any).isFluxAuthenticating = false;
        }
        return;
      }

      if (u) {
        localStorage.removeItem('flux_voluntary_logout');

        // Fetch from Firestore without active websocket to save concurrents
        const userRef = doc(db, "users", u.uid);
        
        const fetchAndSyncUserData = async (retryCount = 0) => {
          try {
            const snapshot = await getDoc(userRef);
            
            const isVipAccount = u.email?.startsWith('vip_');
            let tStart = null;
            let subEnd = null;
            let trialDurationDays = 7;
            let planType = isVipAccount ? "free" : "none";
            let allowedUsers = 1;
            let activeSessionId = null;
            
            if (!snapshot.exists()) {
              const creationTime = new Date(u.metadata.creationTime).getTime();
              const isNewUser = (Date.now() - creationTime) < 120000;
              if (!isNewUser) {
                console.warn("User deleted remotely. Signing out.");
                signOut(auth);
                return;
              }

              // Create default user document
              const defaultAvatar = u.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.displayName || u.email || u.uid)}`;
              await setDoc(userRef, {
                email: u.email || "anonymous",
                displayName: u.displayName || "Usuario",
                photoURL: defaultAvatar,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                lastActiveAt: Date.now(),
                totalUsageTime: 0,
                trialStart: null,
                plan: "none",
                maxUsers: 1
              });
            } else {
              const data = snapshot.data();
              setDbUserProfile({
                displayName: data.displayName,
                photoURL: data.photoURL
              });
              tStart = data.trialStart !== undefined ? data.trialStart : null;
              subEnd = data.subscriptionEnd !== undefined ? data.subscriptionEnd : null;
              trialDurationDays = data.trialDuration || 7;
              planType = data.plan || (isVipAccount ? "free" : "none");
              allowedUsers = data.maxUsers || 1;
              activeSessionId = data.activeSessionId || null;

              // Update last login & active timestamps silently
              await setDoc(userRef, { 
                lastLogin: serverTimestamp(),
                lastActiveAt: Date.now()
              }, { merge: true });
            }

            const now = Date.now();
            const msPerDay = 1000 * 60 * 60 * 24;

            let isValid = false;
            let daysRemaining = 0;

            if (u.email === "eltygere8651@gmail.com") {
              isValid = true;
              daysRemaining = 999;
            } else if (subEnd && subEnd > now) {
              isValid = true;
              daysRemaining = Math.max(0, Math.ceil((subEnd - now) / msPerDay));
            } else if (planType === "free" && tStart) {
              const trialEnd = tStart + trialDurationDays * msPerDay;
              if (trialEnd > now) {
                isValid = true;
                daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
              }
            }
            
            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            // Clean up ghost anonymous users that have no trial/plan
            if (u.isAnonymous && !finalIsValid && !finalTStart && planType === "none") {
                console.log("Ghost user detected, signing out...");
                await signOut(auth);
                return;
            }
            
            setAccessData({
              trialStart: finalTStart,
              subscriptionEnd: subEnd,
              plan: finalPlan,
              isValid: finalIsValid,
              daysRemaining,
              maxUsers: allowedUsers,
              activeSessionId: activeSessionId
            });
          } catch(err) {
            console.error("Firestore getDoc / syncProfile error:", err);
            if (retryCount < 2) {
              setTimeout(() => fetchAndSyncUserData(retryCount + 1), 2000);
            }
          }
        };

        fetchAndSyncUserData();
      } else {
        setAccessData(null);
        setDbUserProfile(null);
      }
      setUser(u);
      setLoading(false);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const mergedUser = useMemo(() => {
    if (!user) return null;
    const u = Object.create(user);
    if (dbUserProfile?.displayName) {
      Object.defineProperty(u, "displayName", {
        value: dbUserProfile.displayName,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    if (dbUserProfile?.photoURL) {
      Object.defineProperty(u, "photoURL", {
        value: dbUserProfile.photoURL,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    return u as User;
  }, [user, dbUserProfile]);

  return (
    <FirebaseContext.Provider value={{ user: mergedUser, loading, isOnline, authError, clearAuthError, isAuthModalOpen, setAuthModalOpen, accessData }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Error handler utility from skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
