import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check, Star, Headphones, Music, Shield, Loader2, ArrowRight } from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FluxLogo } from './FluxLogo';

export const VIPLandingView = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campId = params.get('campaign');
    if (campId) {
      setCampaignId(campId);
      // Increment scans only once per session
      if (!sessionStorage.getItem(`scanned_${campId}`)) {
        sessionStorage.setItem(`scanned_${campId}`, 'true');
        updateDoc(doc(db, 'qr_campaigns', campId), { scans: increment(1) }).catch(e => console.error(e));
      }
    }
  }, []);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Enviar email vía backend (proxy hacia Trigger Email)
      console.log("🔐 CÓDIGO VIP DE PRUEBA (Solo en desarrollo):", newCode);
      
      const res = await fetch('/api/vip/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: newCode })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el código');
      }

      setGeneratedCode(newCode);
      setStep('code');
    } catch (e: any) {
      console.error(e);
      setError('Ocurrió un error al enviar el código. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code !== generatedCode) {
      setError('Código incorrecto. Verifica tu correo.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Registrar e iniciar sesión
      const password = Math.random().toString(36).slice(-10) + "A1!";
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(cred.user, { displayName: "Socio VIP" });

      const now = Date.now();
      const userRef = doc(db, 'users', cred.user.uid);
      
      // Activar 7 días Premium
      await setDoc(userRef, {
        email: email,
        displayName: "Socio VIP",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        lastActiveAt: now,
        totalUsageTime: 0,
        plan: "free",
        trialStart: now,
        maxUsers: 1,
        originCampaign: campaignId || null,
      }, { merge: true });

      if (campaignId) {
        updateDoc(doc(db, 'qr_campaigns', campaignId), { vipActivations: increment(1) }).catch(e => console.error(e));
      }

      // Programar correos automáticos (Bienvenida, Recordatorios) vía backend
      await fetch('/api/vip/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch(e => console.error('Error al enviar correos de bienvenida:', e));

      // Redirigir a la app eliminando el parametro vip de la URL
      window.history.replaceState({}, '', '/');
      window.location.reload();

    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado en Flux.');
      } else {
        setError('Error al activar el Pase VIP.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000] flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Decorative Glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section / Benefits */}
      <div className="w-full md:flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 bg-gradient-to-br from-black via-[#0a0a0a] to-[#121212] md:border-r md:border-white/5 border-b border-white/5 md:border-b-0">
        <div className="max-w-lg w-full mx-auto py-8 md:py-0">
          <div className="mb-12">
            <FluxLogo />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Has recibido un <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Pase VIP Exclusivo.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
            Activa tus 7 días de acceso Premium y descubre el ecosistema musical definitivo sin interrupciones.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                <Music className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Música Ilimitada</h3>
                <p className="text-slate-500 text-sm mt-1">Millones de canciones en alta fidelidad y playlists curadas.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                <Headphones className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Flux Radio con Sofía DJ</h3>
                <p className="text-slate-500 text-sm mt-1">Tu emisora personal conducida por nuestra locutora de IA.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                <Star className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Karaoke Flux</h3>
                <p className="text-slate-500 text-sm mt-1">Canta tus canciones favoritas con letras sincronizadas reales.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Sin Anuncios</h3>
                <p className="text-slate-500 text-sm mt-1">Experiencia pura. Cero interrupciones comerciales.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:flex-1 p-8 py-16 md:p-16 flex flex-col justify-center items-center relative z-10 bg-[#070708]">
        <div className="max-w-sm w-full space-y-8">
          
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Comienza ahora</h2>
                  <p className="text-slate-400 text-sm font-medium">Ingresa tu correo para recibir tu código de activación VIP.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-medium"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs font-semibold text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}

                <button
                  onClick={handleSendCode}
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(30,215,96,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Enviar Código <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="code-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Verifica tu código</h2>
                  <p className="text-slate-400 text-sm font-medium">Hemos enviado un código de 6 dígitos a <span className="text-white font-bold">{email}</span></p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Código de 6 dígitos</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {error && <p className="text-red-400 text-xs font-semibold text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}

                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(30,215,96,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Activar VIP <Check className="w-5 h-5" /></>
                  )}
                </button>
                
                <button 
                  onClick={() => setStep('email')} 
                  className="w-full text-slate-500 hover:text-white text-xs font-bold transition-colors uppercase tracking-widest py-2"
                >
                  Cambiar Correo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-slate-600 text-[10px] text-center font-semibold max-w-xs mx-auto">
            Al continuar, aceptas nuestros términos de servicio y políticas de privacidad. Válido solo para usuarios nuevos.
          </p>
        </div>
      </div>
    </div>
  );
};
