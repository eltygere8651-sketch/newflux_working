import React, { useState, useEffect } from 'react';
import { Check, Loader2, ArrowRight, MessageSquare, Info } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('flux_vip_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('flux_vip_device_id', id);
  }
  return id;
};

type TrialState = 'loading' | 'new' | 'active' | 'expired';

export const VIPLandingView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trialState, setTrialState] = useState<TrialState>('loading');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const campId = params.get('campaign');
      if (campId) {
        setCampaignId(campId);
        if (!sessionStorage.getItem(`scanned_${campId}`)) {
          sessionStorage.setItem(`scanned_${campId}`, 'true');
          updateDoc(doc(db, 'qr_campaigns', campId), { scans: increment(1) }).catch(e => console.error(e));
        }
      }

      try {
        const hash = await generateDeviceHash();
        const hashRef = doc(db, 'vip_devices', hash);
        const hashDoc = await getDoc(hashRef);

        if (mounted) {
          if (hashDoc.exists()) {
            const data = hashDoc.data();
            const activatedAt = data.activatedAt || 0;
            const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
            if (isExpired) {
              setTrialState('expired');
            } else {
              setTrialState('active');
            }
          } else {
            setTrialState('new');
          }
        }
      } catch (e) {
        if (mounted) setTrialState('new');
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleActivateOrContinue = async () => {
    setIsLoading(true);
    try {
      const uuid = getOrCreateDeviceId();
      const deviceHash = await generateDeviceHash();
      
      const hashRef = doc(db, 'vip_devices', deviceHash);
      const hashDoc = await getDoc(hashRef);
      
      if (hashDoc.exists()) {
        const data = hashDoc.data();
        const activatedAt = data.activatedAt || 0;
        const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
        
        if (isExpired) {
          setTrialState('expired');
          setIsLoading(false);
          return;
        } else {
          // Continue existing trial using persistent email/password to avoid creating a new UID
          const vipEmail = `socio.${deviceHash.substring(0, 6)}@fluxmusic.com`;
          const vipPass = `${deviceHash.substring(0, 10)}_fluxvip`;
          
          try {
            await signInWithEmailAndPassword(auth, vipEmail, vipPass);
            window.history.replaceState({}, '', '/');
            window.location.reload();
            return;
          } catch (signInErr: any) {
            console.error("Recovery signIn error:", signInErr);
            // If they don't exist yet as email/pass (legacy anonymous account), we fallback to creating an email/pass account so next time they don't lose it
            const userCred = await createUserWithEmailAndPassword(auth, vipEmail, vipPass);
            const newUid = userCred.user.uid;
            const now = Date.now();
            
            await setDoc(doc(db, 'vip_activations', newUid), {
              uuid,
              deviceHash,
              createdAt: activatedAt,
              expiresAt: activatedAt + 7 * 24 * 60 * 60 * 1000,
              version: 3,
              status: 'active',
              campaignId: campaignId || null
            });
            
            await setDoc(doc(db, "users", newUid), {
              email: vipEmail,
              displayName: "Socio VIP",
              isVIPGuest: true,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              lastActiveAt: now,
              totalUsageTime: 0,
              plan: "free",
              trialStart: activatedAt,
              maxUsers: 1,
              originCampaign: campaignId || null,
            }, { merge: true });

            await updateDoc(hashRef, {
              uid: newUid,
              lastRecoveredAt: now
            });

            window.history.replaceState({}, '', '/');
            window.location.reload();
            return;
          }
        }
      }
      
      // New activation
      const vipEmail = `socio.${deviceHash.substring(0, 6)}@fluxmusic.com`;
      const vipPass = `${deviceHash.substring(0, 10)}_fluxvip`;
      const userCred = await createUserWithEmailAndPassword(auth, vipEmail, vipPass);
      const uid = userCred.user.uid;
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
        email: vipEmail,
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
      
      window.history.replaceState({}, '', '/');
      window.location.reload();

    } catch (e: any) {
      console.error(e);
      setTrialState('new');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = async () => {
    try {
      setIsLoading(true);
      if (!auth.currentUser) {
        const deviceHash = await generateDeviceHash();
        const vipEmail = `socio.${deviceHash.substring(0, 6)}@fluxmusic.com`;
        const vipPass = `${deviceHash.substring(0, 10)}_fluxvip`;
        
        try {
          await signInWithEmailAndPassword(auth, vipEmail, vipPass);
        } catch (signInErr) {
          const userCred = await createUserWithEmailAndPassword(auth, vipEmail, vipPass);
          const uid = userCred.user.uid;
          const now = Date.now();
          // Create an expired user record so they see "Fin de la Prueba VIP" in the background
          await setDoc(doc(db, "users", uid), {
            email: vipEmail,
            displayName: "Socio VIP",
            isVIPGuest: true,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            lastActiveAt: now,
            totalUsageTime: 0,
            plan: "free",
            trialStart: now - (8 * 24 * 60 * 60 * 1000), // explicitly expired (8 days ago)
            maxUsers: 1,
            originCampaign: campaignId || null,
          }, { merge: true });
        }
      }
      window.history.replaceState({}, '', '/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-support', {
          detail: {
            message: "Hola.\n\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\n\nQuedo pendiente."
          }
        }));
      }, 800);
    } catch(e) {
      console.error("Error signing in for support:", e);
      setIsLoading(false);
    }
  };

  if (trialState === 'loading') {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (trialState === 'expired') {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <span className="text-6xl mb-6 block z-10">🎵</span>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 z-10">Ya disfrutaste de tu prueba gratuita.</h1>
        <p className="text-slate-300 text-lg mb-6 z-10">Gracias por probar Flux Music.</p>
        <p className="text-slate-400 font-medium mb-10 max-w-sm z-10">Continúa disfrutando de toda la música sin anuncios por solo <br/><span className="text-white font-bold text-xl">5 € al mes</span>.</p>
        <button
          onClick={handleContactSupport}
          disabled={isLoading}
          className="w-full max-w-sm bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors z-10 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <><MessageSquare className="w-5 h-5" /> CONTACTAR PARA ACTIVAR PREMIUM</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
       <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
       
       <div className="w-full max-w-sm flex flex-col items-center z-10">
          <span className="text-6xl mb-4 block">🎵</span>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Flux Music Premium</h1>
          <h2 className="text-xl text-emerald-400 font-bold mb-6">7 días gratis</h2>
          
          <div className="flex flex-col gap-1 items-center mb-10 text-slate-300 font-medium text-lg">
             <p>Sin registro</p>
             <p>Sin anuncios</p>
             <p>Miles de canciones</p>
             <p>Todo el contenido desbloqueado</p>
          </div>

          <div className="space-y-4 mb-6 text-left w-full pl-4 md:pl-8">
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Música ilimitada</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Sin anuncios</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Karaoke Premium</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Flux Radio IA</p>
          </div>

          <div className="mb-8 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  Tendrás acceso a prácticamente toda la experiencia Flux Music durante tu prueba gratuita. La reproducción de música con la pantalla del móvil bloqueada es una ventaja exclusiva para los usuarios Premium.
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  Descubre todo lo demás sin restricciones y decide después si quieres dar el salto a Premium.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleActivateOrContinue}
            disabled={isLoading}
            className="w-full bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <ArrowRight className="w-5 h-5" /> 
                {trialState === 'active' ? 'CONTINUAR MI PRUEBA' : 'PROBAR GRATIS DURANTE 7 DÍAS'}
              </>
            )}
          </button>

          {trialState === 'new' && (
             <button 
               onClick={handleActivateOrContinue}
               disabled={isLoading}
               className="mt-6 text-emerald-400 font-bold underline decoration-emerald-400/30 underline-offset-4 hover:text-emerald-300 text-sm disabled:opacity-50"
             >
               Ya tengo una prueba activa
             </button>
          )}
       </div>
    </div>
  );
};
