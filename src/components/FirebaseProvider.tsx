import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
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


const generateDeviceHash = async () => {
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
  } catch (e) {}
  
  const components = [
    os,
    screenRes,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
    canvasFingerprint
  ].join('|');
  
  const msgBuffer = new TextEncoder().encode(components);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

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

      if (u) {
        // Fetch from Firestore without active websocket to save concurrents
        const userRef = doc(db, "users", u.uid);
        
        const fetchUserData = async () => {
          try {
            const snapshot = await getDoc(userRef);
            let deviceHasTrial = false;
            let deviceTrialActive = false;
            let deviceTrialStart = 0;
            try {
              const hash = await generateDeviceHash();
              const hashRef = doc(db, 'vip_devices', hash);
              const hashDoc = await getDoc(hashRef);
              if (hashDoc.exists()) {
                deviceHasTrial = true;
                const hd = hashDoc.data();
                deviceTrialStart = hd.activatedAt || 0;
                if (Date.now() <= deviceTrialStart + 7 * 24 * 60 * 60 * 1000) {
                  deviceTrialActive = true;
                }
              }
            } catch (e) {
              console.error("Device hash check failed", e);
            }
            
            const isVipAccount = u.email?.startsWith('vip_');
            let tStart = null;
            let subEnd = null;
            let planType = isVipAccount ? "free" : "none";
            let allowedUsers = 1;
            let activeSessionId = null;
            
            if (snapshot.exists()) {
              const data = snapshot.data();
              setDbUserProfile({
                displayName: data.displayName,
                photoURL: data.photoURL
              });
              tStart = data.trialStart !== undefined ? data.trialStart : null;
              subEnd = data.subscriptionEnd !== undefined ? data.subscriptionEnd : null;
              planType = data.plan || (isVipAccount ? "free" : "none");
              allowedUsers = data.maxUsers || 1;
              activeSessionId = data.activeSessionId || null;
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
              const trialEnd = tStart + 7 * msPerDay;
              if (trialEnd > now) {
                isValid = true;
                daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
              }
            }
            
            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            // Apply device trial ONLY if the user doesn't have an explicitly expired account trial or subscription
            const hasExplicitSub = subEnd !== null;
            const hasExplicitTrial = tStart !== null;
            const isSubExpired = hasExplicitSub && subEnd <= now;
            const isTrialExpired = hasExplicitTrial && (tStart + 7 * msPerDay) <= now;
            const isPlanNone = planType === 'none';

            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              const shouldApplyDeviceTrial = !isSubExpired && !isTrialExpired && !isPlanNone;
              
              if (shouldApplyDeviceTrial) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else if (!hasExplicitSub && !hasExplicitTrial) {
                  // Only force expiration from device trial if the user has no explicit trial/sub themselves
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
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
            console.error("Firestore getDoc error:", err);
          }
        };

        fetchUserData();

        // High precision & low-resource session time tracking
        const lastSyncTimeRef = { current: Date.now() };
        const lastActiveTimeRef = { current: Date.now() };

        const syncUsageAndActivity = async (isClosing = false) => {
          if (!auth.currentUser) return;
          const now = Date.now();
          const diffSeconds = Math.floor((now - lastSyncTimeRef.current) / 1000);
          
          // Only update if at least 15 seconds have passed, or we are explicitly closing/refreshing
          if (diffSeconds >= 15 || isClosing) {
            lastSyncTimeRef.current = now;
            lastActiveTimeRef.current = now;
            
            try {
              const userRef = doc(db, "users", auth.currentUser.uid);
              // Update both the online status timestamp and the accumulated usage time safely in 1 single light update
              await setDoc(userRef, {
                lastActiveAt: now,
                totalUsageTime: increment(diffSeconds)
              }, { merge: true });
            } catch (err) {
              console.warn("Could not sync user usage stats:", err);
            }
          }
        };

        const pollInterval = setInterval(() => {
          // Fetch access state & also sync general app usage stats every 5 minutes (incredibly cost efficient!)
          fetchUserData();
          if (document.visibilityState === "visible") {
            syncUsageAndActivity();
          }
        }, 5 * 60 * 1000);

        // User activity detector (clicks/keys) to keep status fresh, with a 3 minute debounce limit to avoid excessive writes
        const handleUserInteraction = () => {
          const now = Date.now();
          if (now - lastActiveTimeRef.current > 3 * 60 * 1000 && document.visibilityState === "visible") {
            syncUsageAndActivity();
          }
        };

        window.addEventListener("click", handleUserInteraction);
        window.addEventListener("keydown", handleUserInteraction);
        
        // Unload hook to sync any pending usage before tab closes
        const handleBeforeUnload = () => {
          // Use synchronous-like sync profile if possible
          syncUsageAndActivity(true);
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        unsubscribeFirestore = () => {
          clearInterval(pollInterval);
          window.removeEventListener("click", handleUserInteraction);
          window.removeEventListener("keydown", handleUserInteraction);
          window.removeEventListener("beforeunload", handleBeforeUnload);
          // Sync final remaining usage when auth state changes or provider unmounts
          syncUsageAndActivity(true);
        };

        const syncProfile = async (retryCount = 0) => {
          try {
            const userRef = doc(db, "users", u.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              // Create user doc without trial
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
              fetchUserData();
            } else {
              // Update last login & active
              await setDoc(userRef, { 
                lastLogin: serverTimestamp(),
                lastActiveAt: Date.now()
              }, { merge: true });
            }
          } catch (e) {
            console.error("Profile sync attempt failed", e);
            if (retryCount < 2) {
              setTimeout(() => syncProfile(retryCount + 1), 2000);
            }
          }
        };
        syncProfile();
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
