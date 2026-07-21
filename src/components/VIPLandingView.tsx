import React, { useState, useEffect } from 'react';
import { Check, Loader2, ArrowRight, MessageSquare, Info, LogOut, Mail } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth, migrateGuestData } from '../lib/firebase';
import { signInAnonymously, signOut, EmailAuthProvider, linkWithCredential, linkWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateEmail, updatePassword } from 'firebase/auth';
import { generateDeviceHash } from '../lib/deviceHash';

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('flux_vip_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('flux_vip_device_id', id);
  }
  return id;
};

type TrialState = 'loading' | 'new' | 'active' | 'expired' | 'link-email';

export const VIPLandingView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trialState, setTrialState] = useState<TrialState>('loading');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Email Linking State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      // Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (mounted) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
             const data = userDoc.data();
             if (data.isVIPGuest || data.trialStart) {
                const activatedAt = data.trialStart || 0;
                const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
                
                if (isExpired) {
                  setTrialState('expired');
                } else {
                  setTrialState('active');
                }
             } else {
                setTrialState('new');
             }
          } else {
             setTrialState('new');
          }
        }
      } else {
        if (mounted) setTrialState('new');
      }
    };
    init();
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            init();
        }
    });
    
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const handleActivateOrContinue = async () => {
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
           const data = userDoc.data();
           
           if (data.trialStart) {
               const activatedAt = data.trialStart;
               const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
               if (isExpired) {
                 setTrialState('expired');
                 setIsLoading(false);
                 return;
               } else {
                 window.history.replaceState({}, '', '/');
                 window.location.reload();
                 return;
               }
           }
        }
      }
      
      // If we reach here, they are either not signed in, or they are signed in but don't have a trialStart yet.
      let uid;
      if (!currentUser || currentUser.isAnonymous) {
         const oldUid = currentUser ? currentUser.uid : null;
         const hash = await generateDeviceHash();
         const internalEmail = `socio.${hash.substring(0, 6)}@fluxmusic.com`;
         const internalPass = `${hash.substring(0, 10)}_fluxvip`;
         
         let userCred;
         try {
             userCred = await signInWithEmailAndPassword(auth, internalEmail, internalPass);
         } catch (e) {
             userCred = await createUserWithEmailAndPassword(auth, internalEmail, internalPass);
         }
         uid = userCred.user.uid;
         
         if (oldUid && oldUid !== uid) {
             try {
                 await migrateGuestData(oldUid, uid);
             } catch (e) {
                 console.error("Failed to migrate guest data", e);
             }
         }
      } else {
         uid = currentUser.uid;
      }
      const now = Date.now();
      
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const prefixes = ['FluxUser', 'MusicFan', 'Listener', 'FluxRock', 'Player'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomName = `${prefix}${randomId}`;
      
      const uuid = getOrCreateDeviceId();
      
      if (campaignId) {
        updateDoc(doc(db, 'qr_campaigns', campaignId), { vipActivations: increment(1) }).catch(e => console.error(e));
      }
      
      await setDoc(doc(db, "users", uid), {
        displayName: randomName,
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

  const handleLinkGoogle = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, provider);
        window.history.replaceState({}, '', '/');
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
         setErrorMsg("Esta cuenta de Google ya está en uso.");
      } else {
         setErrorMsg(err.message || "Error al conectar con Google.");
      }
      setIsLoading(false);
    }
  };
  
  const handleLinkEmail = async (e: React.FormEvent) => {
     e.preventDefault();
     if (password !== confirmPassword) {
         setErrorMsg("Las contraseñas no coinciden.");
         return;
     }
     setIsLoading(true);
     setErrorMsg(null);
     try {
         if (auth.currentUser) {
             const isInternal = auth.currentUser.email?.startsWith("socio.");
             if (auth.currentUser.isAnonymous) {
                 const cred = EmailAuthProvider.credential(email, password);
                 await linkWithCredential(auth.currentUser, cred);
             } else if (isInternal) {
                 await updateEmail(auth.currentUser, email);
                 await updatePassword(auth.currentUser, password);
             } else {
                 // In case it's already another provider or normal email, try link (will fail if already email)
                 const cred = EmailAuthProvider.credential(email, password);
                 await linkWithCredential(auth.currentUser, cred);
             }
             window.history.replaceState({}, '', '/');
             window.location.reload();
         }
     } catch (err: any) {
         console.error(err);
         if (err.code === 'auth/email-already-in-use') {
            setErrorMsg("Este correo ya está registrado.");
         } else if (err.code === 'auth/weak-password') {
            setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
         } else {
            setErrorMsg(err.message || "Error al vincular el correo.");
         }
         setIsLoading(false);
     }
  };

  const handleContactSupport = () => {
      window.dispatchEvent(new CustomEvent('open-sidebar-menu', {
        detail: {
          openSupport: true,
          message: "Hola.\n\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\n\nQuedo pendiente."
        }
      }));
  };

  if (trialState === 'loading') {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (trialState === 'link-email') {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
         <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
         <h1 className="text-2xl md:text-3xl font-black text-white mb-2 z-10">Continuar con Email</h1>
         <p className="text-slate-400 mb-8 z-10">Vincula un correo para no perder tu música.</p>
         
         <form onSubmit={handleLinkEmail} className="w-full max-w-sm z-10 space-y-4">
             {errorMsg && (
                 <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-left">
                   {errorMsg}
                 </div>
             )}
             <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo Electrónico"
                className="w-full px-4 py-3 bg-[#121214] border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#1ED760]"
             />
             <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 bg-[#121214] border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#1ED760]"
             />
             <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-3 bg-[#121214] border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#1ED760]"
             />
             
             <button
               type="submit"
               disabled={isLoading}
               className="w-full mt-4 bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50"
             >
               {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "VINCULAR CUENTA"}
             </button>
             
             <button
                type="button"
                onClick={() => setTrialState('expired')}
                className="mt-4 text-slate-400 font-bold hover:text-white transition-colors text-sm uppercase tracking-wider"
             >
                VOLVER
             </button>
         </form>
      </div>
    );
  }

  if (trialState === 'expired') {
    const isInternalAccount = auth.currentUser?.email?.startsWith("socio.");
    const isAnonymous = auth.currentUser?.isAnonymous || isInternalAccount;
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <span className="text-6xl mb-6 block z-10">🎵</span>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 z-10">
           {isAnonymous ? "Conserva toda tu música" : "Ya disfrutaste de tu prueba gratuita."}
        </h1>
        <p className="text-slate-300 text-lg mb-8 z-10">
           {isAnonymous 
             ? "No pierdas tus playlists, historial ni favoritos." 
             : "Continúa disfrutando de toda la música sin anuncios por solo 5 € al mes."}
        </p>
        
        {isAnonymous ? (
            <div className="flex flex-col gap-4 w-full max-w-sm z-10 mt-4">
                 <button
                   onClick={() => setTrialState('link-email')}
                   className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                 >
                   📧 Continuar con Email
                 </button>
                 
                 <button
                   onClick={handleLinkGoogle}
                   disabled={isLoading}
                   className="w-full bg-[#4285F4] text-white font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3367d6] transition-colors disabled:opacity-50"
                 >
                   {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "🔵 Continuar con Google"}
                 </button>
            </div>
        ) : (
            <button
              onClick={handleContactSupport}
              disabled={isLoading}
              className="w-full max-w-sm bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors z-10 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>⚡ SOLICITAR PREMIUM (ABRIR MENÚ LATERAL)</>
              )}
            </button>
        )}

        {auth.currentUser && (
          <button
            onClick={() => {
              signOut(auth);
              window.location.reload();
            }}
            className="mt-12 text-white/40 hover:text-white/80 transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 z-10"
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
