import { auth } from "./firebase";
import { signInWithEmailAndPassword, signInAnonymously, linkWithCredential, EmailAuthProvider } from "firebase/auth";

export const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('flux_vip_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('flux_vip_device_id', id);
  }
  return id;
};

export const recoverOrSignInGuest = async () => {
  if (auth.currentUser) return { user: auth.currentUser };
  
  const uuid = getOrCreateDeviceId();
  const guestEmail = `socio.${uuid.substring(0, 8)}@fluxmusic.com`;
  const guestPass = `${uuid}_fluxvip`;

  try {
    const cred = await signInWithEmailAndPassword(auth, guestEmail, guestPass);
    return cred;
  } catch (err: any) {
    const cred = await signInAnonymously(auth);
    
    try {
      await linkWithCredential(cred.user, EmailAuthProvider.credential(guestEmail, guestPass));
    } catch (linkErr) {
      console.warn("Failed to link guest credential:", linkErr);
    }
    
    return cred;
  }
};
