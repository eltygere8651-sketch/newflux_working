const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Headphones, Music, Shield, Loader2, ArrowRight } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { FluxLogo } from './FluxLogo';

const generateDeviceHash = async () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    window.screen.width + 'x' + window.screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
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

export const VIPLandingView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campId = params.get('campaign');
    if (campId) {
      setCampaignId(campId);
      // Increment scans only once per session
      if (!sessionStorage.getItem(\`scanned_\${campId}\`)) {
        sessionStorage.setItem(\`scanned_\${campId}\`, 'true');
        updateDoc(doc(db, 'qr_campaigns', campId), { scans: increment(1) }).catch(e => console.error(e));
      }
    }
  }, []);

  const handleActivateVIP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const uuid = getOrCreateDeviceId();
      const deviceHash = await generateDeviceHash();
      
      const res = await fetch('/api/vip/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, deviceHash, campaignId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al activar VIP');
      }

      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else {
         throw new Error("No se recibió el token de acceso");
      }

      // Limpiar URL e ir a home
      window.history.replaceState({}, '', '/');
      window.location.reload();

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al activar el Pase VIP.');
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

      {/* Action Section */}
      <div className="w-full md:flex-1 p-8 py-16 md:p-16 flex flex-col justify-center items-center relative z-10 bg-[#070708]">
        <div className="max-w-sm w-full space-y-8">
          
          <AnimatePresence mode="wait">
              <motion.div
                key="activate-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex flex-col items-center text-center"
              >
                <div>
                  <h2 className="text-3xl font-black text-white mb-4">Acceso Inmediato</h2>
                  <p className="text-slate-400 text-sm font-medium mb-8">Comienza a disfrutar de todas las ventajas ahora mismo, sin registros ni tarjetas de crédito.</p>
                </div>

                {error && <p className="text-red-400 text-xs font-semibold text-center bg-red-400/10 py-3 px-4 rounded-xl w-full">{error}</p>}

                <button
                  onClick={handleActivateVIP}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-black uppercase tracking-widest py-5 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(30,215,96,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <span>Probar Gratis 7 días</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <p className="text-slate-600 text-[10px] text-center font-semibold mt-4">
                  Activación anónima basada en dispositivo. Válido solo para usuarios nuevos.
                </p>
              </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/VIPLandingView.tsx', code);
