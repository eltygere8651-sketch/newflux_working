import React, { useState, useEffect } from 'react';
import { Check, Loader2, ArrowRight, MessageSquare, Info, LogOut } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth, generateDeviceHash, generateHardwareSignature, signInWithCustomToken } from '../lib/firebase';
import { signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
        const hardwareSignature = await generateHardwareSignature();
        
        // Consultar el estado del dispositivo de forma segura en el servidor
        const response = await fetch('/api/trial/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: hash, hardwareSignature })
        });

        if (!response.ok) {
          throw new Error('No se pudo verificar el estado de la prueba');
        }

        const data = await response.json();

        if (mounted && data.success) {
          if (data.trialUsed) {
            if (data.trialExpired) {
              setTrialState('expired');
            } else {
              setTrialState('active');
            }
          } else {
            setTrialState('new');
          }
        } else {
          if (mounted) setTrialState('new');
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
      const deviceHash = await generateDeviceHash();
      const hardwareSignature = await generateHardwareSignature();
      
      // Llamar al API seguro del servidor para la activación VIP atómica
      const response = await fetch('/api/trial/activate-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: deviceHash, campaignId, hardwareSignature })
      });

      if (!response.ok) {
        if (response.status === 403) {
          // El dispositivo ya fue usado. Validemos si está expirado o si necesita re-autenticar
          const checkRes = await fetch('/api/trial/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: deviceHash })
          });
          
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.trialUsed) {
              if (checkData.trialExpired) {
                setTrialState('expired');
              } else {
                // Recuperar inicio de sesión para el dispositivo registrado
                const vipEmail = `socio.${deviceHash.substring(0, 6)}@fluxmusic.com`;
                const vipPass = `${deviceHash.substring(0, 10)}_fluxvip`;
                await signInWithEmailAndPassword(auth, vipEmail, vipPass);
                window.history.replaceState({}, '', '/');
                window.location.reload();
                return;
              }
            }
          }
          setIsLoading(false);
          return;
        }
        
        let errorMsg = 'Fallo de activación';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch (_) {
          try {
            const txt = await response.text();
            if (txt) errorMsg = txt;
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (_) {
        throw new Error('Respuesta del servidor no válida');
      }
      if (data.success && data.customToken) {
        // Iniciar sesión con el custom token de alta seguridad provisto por el servidor
        await signInWithCustomToken(auth, data.customToken);
        
        if (campaignId) {
          updateDoc(doc(db, 'qr_campaigns', campaignId), { vipActivations: increment(1) }).catch(e => console.error(e));
        }

        window.history.replaceState({}, '', '/');
        window.location.reload();
      }
    } catch (e: any) {
      console.error("Fallo al activar prueba VIP:", e);
      setTrialState('new');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = async () => {
    try {
      setIsLoading(true);
      if (!auth.currentUser) {
        const userCred = await signInAnonymously(auth);
        const uid = userCred.user.uid;
        const now = Date.now();
        // Create an expired user record so they see "Fin de la Prueba VIP" in the background
        await setDoc(doc(db, "users", uid), {
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
      window.history.replaceState({}, '', '/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-sidebar-menu', {
          detail: {
            openSupport: true,
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
            <>⚡ SOLICITAR PREMIUM (ABRIR MENÚ LATERAL)</>
          )}
        </button>
        {auth.currentUser && (
          <button
            onClick={() => {
              signOut(auth);
              window.location.reload();
            }}
            className="mt-6 text-white/40 hover:text-white/80 transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 z-10"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        )}
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
