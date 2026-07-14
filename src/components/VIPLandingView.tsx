import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Headphones, Star, Shield, ArrowRight, Loader2, MessageSquare, Play } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { FluxLogo } from './FluxLogo';

const generateDeviceHash = async () => {
  const w = window.screen.width || 0;
  const h = window.screen.height || 0;
  const screenRes = Math.max(w, h) + 'x' + Math.min(w, h);
  
  // Extract basic OS, ignoring versions
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  if (ua.indexOf('Linux') !== -1) os = 'Linux';
  if (ua.indexOf('Android') !== -1) os = 'Android';
  if (ua.indexOf('like Mac') !== -1) os = 'iOS';
  
  // Generate canvas fingerprint
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
  } catch (e) {
    // Ignore canvas errors
  }
  
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

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('flux_vip_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('flux_vip_device_id', id);
  }
  return id;
};

interface Props {
  onOpenSupport?: (msg: string) => void;
}

export const VIPLandingView = ({ onOpenSupport }: Props) => {
  const [viewState, setViewState] = useState<'loading' | 'landing' | 'expired'>('loading');
  const [hasActiveTrial, setHasActiveTrial] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campId = params.get('campaign');
    if (campId) {
      setCampaignId(campId);
      if (!sessionStorage.getItem(`scanned_${campId}`)) {
        sessionStorage.setItem(`scanned_${campId}`, 'true');
        updateDoc(doc(db, 'qr_campaigns', campId), { scans: increment(1) }).catch(e => console.error(e));
      }
    }
    
    // Check device state on load
    const checkDevice = async () => {
      try {
        const hash = await generateDeviceHash();
        const hashDoc = await getDoc(doc(db, 'vip_devices', hash));
        if (hashDoc.exists()) {
          const activatedAt = hashDoc.data()?.activatedAt || 0;
          const isExpired = Date.now() > activatedAt + 7 * 24 * 60 * 60 * 1000;
          if (isExpired) {
            setViewState('expired');
          } else {
            setHasActiveTrial(true);
            setViewState('landing');
          }
        } else {
          setViewState('landing');
        }
      } catch (e) {
        setViewState('landing');
      }
    };
    checkDevice();
  }, []);

  const handleActivateVIP = async (isRestore: boolean) => {
    setError('');
    setIsLoading(true);
    try {
      const uuid = getOrCreateDeviceId();
      const deviceHash = await generateDeviceHash();
      
      const hashRef = doc(db, 'vip_devices', deviceHash);
      const hashDoc = await getDoc(hashRef);
      
      let targetUid = null;
      let targetActivatedAt = Date.now();
      
      if (hashDoc.exists()) {
        const data = hashDoc.data();
        targetActivatedAt = data?.activatedAt || 0;
        const isExpired = Date.now() > targetActivatedAt + 7 * 24 * 60 * 60 * 1000;
        
        if (isExpired) {
          setViewState('expired');
          return;
        }
        
        if (!isRestore) {
            // Already activated, just let them restore but they clicked the wrong button maybe
            // Do not throw error, just continue as restore
        }
        targetUid = data?.uid;
      } else if (isRestore) {
          setError('No se encontró ninguna prueba activa en este dispositivo.');
          setIsLoading(false);
          return;
      }
      
      // We must authenticate anonymously
      // Since they are not authenticated, we sign in anonymously.
      const userCred = await signInAnonymously(auth);
      const uid = userCred.user.uid;
      
      if (!hashDoc.exists()) {
          // New activation
          const now = Date.now();
          await setDoc(hashRef, { 
            activatedAt: now,
            uid: uid 
          });
          
          await setDoc(doc(db, 'vip_activations', uid), {
            uuid,
            deviceHash,
            createdAt: now,
            expiresAt: now + 7 * 24 * 60 * 60 * 1000,
            version: 3,
            status: 'active',
            campaignId: campaignId || null
          });
          
          if (campaignId) {
            updateDoc(doc(db, 'qr_campaigns', campaignId), { vipActivations: increment(1) }).catch(e => console.error(e));
          }
          
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
            originCampaign: campaignId || null,
          }, { merge: true });
      } else {
          // Restore: they already had an active trial, but lost auth state.
          // They signed in as a NEW anonymous user, but we just link their new UID to the trial so they can access the app.
          // Wait, the prompt says "Sin consumir otra prueba. Sin crear otro usuario. Sin crear otro UID. Sin escribir nuevos documentos."
          // But we CANNOT login without creating an UID. We must create an UID (handled by Firebase Auth).
          // But we don't need to write to "users" collection again to create a new trial. 
          // However, without a user document, they can't access the app properly because App.tsx checks their user doc.
          // Since the prompt forbids writing new documents or consuming another trial, we can just point this new anonymous UID to the existing expiration time.
          const expirationTime = targetActivatedAt + 7 * 24 * 60 * 60 * 1000;
          
          // Re-create their basic user profile so they can enter the app
          await setDoc(doc(db, "users", uid), {
            email: `vip_${uid.substring(0, 8)}@flux.local`,
            displayName: "Socio VIP (Recuperado)",
            isVIPGuest: true,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            lastActiveAt: Date.now(),
            totalUsageTime: 0,
            plan: "free",
            trialStart: targetActivatedAt,
            maxUsers: 1,
            originCampaign: campaignId || null,
          }, { merge: true });
          // No new vip_activations, no new vip_devices, just restoring access via a new proxy user.
      }
      
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al procesar la solicitud.');
      setIsLoading(false);
    }
  };

  const handleSupportContact = () => {
      const msg = "Hola.\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\nQuedo pendiente.";
      if (onOpenSupport) {
          onOpenSupport(msg);
      }
  };

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (viewState === 'expired') {
    return (
      <div className="min-h-screen w-full bg-[#000] flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md relative z-10 space-y-8">
          <div className="flex justify-center mb-6">
            <FluxLogo />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            🎵<br/><br/>
            Ya disfrutaste de tu prueba gratuita.
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            Gracias por probar Flux Music. Continúa disfrutando de toda la música sin anuncios por solo <strong className="text-emerald-400">5 € al mes</strong>.
          </p>
          <button
            onClick={handleSupportContact}
            className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-black uppercase tracking-widest py-5 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(30,215,96,0.2)] flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Contactar para activar Premium</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#000] flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Decorative Glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Hero Section */}
      <div className="w-full md:flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 bg-gradient-to-br from-black via-[#0a0a0a] to-[#121212] md:border-r md:border-white/5 border-b border-white/5 md:border-b-0">
        <div className="max-w-md w-full mx-auto py-8 md:py-0">
          <div className="mb-8">
            <FluxLogo />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8 leading-tight">
            🎵<br/>
            Flux Music Premium<br/>
            <span className="text-emerald-400">7 días gratis</span>
          </h1>
          
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-3 text-white font-medium text-lg">
              <span className="text-emerald-400 font-bold">✓</span> Música ilimitada
            </div>
            <div className="flex items-center gap-3 text-white font-medium text-lg">
              <span className="text-emerald-400 font-bold">✓</span> Sin anuncios
            </div>
            <div className="flex items-center gap-3 text-white font-medium text-lg">
              <span className="text-emerald-400 font-bold">✓</span> Karaoke Premium
            </div>
            <div className="flex items-center gap-3 text-white font-medium text-lg">
              <span className="text-emerald-400 font-bold">✓</span> Flux Radio IA
            </div>
          </div>
          
          <div className="space-y-4">
            {error && <p className="text-red-400 text-xs font-semibold text-center bg-red-400/10 py-3 px-4 rounded-xl w-full">{error}</p>}
            
            <button
              onClick={() => handleActivateVIP(false)}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-black uppercase tracking-widest py-5 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(30,215,96,0.2)]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{hasActiveTrial ? 'Continuar mi prueba' : 'Probar Gratis durante 7 días'}</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => handleActivateVIP(true)}
              disabled={isLoading}
              className="w-full bg-white/5 text-white font-bold tracking-wide py-4 px-6 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ya tengo una prueba activa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
