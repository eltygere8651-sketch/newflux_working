import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FluxLogoLarge } from "./FluxLogo";
import { CheckCircle2, ChevronRight, Play, Info, Smartphone, ShieldCheck, Sparkles } from "lucide-react";

interface UniversalOnboardingProps {
  onComplete: () => void;
  cards?: any[];
}

export function UniversalOnboarding({ onComplete, cards = [] }: UniversalOnboardingProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    const timeoutId = setTimeout(checkScroll, 500);
    const timeoutId2 = setTimeout(checkScroll, 1500);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [cards]);

  const modularCards = cards;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] text-white overflow-hidden flex flex-col">
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 w-full max-w-xl mx-auto px-4 pt-8 pb-32 sm:px-6 sm:pt-10 sm:pb-36 flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full" />
            <FluxLogoLarge className="w-24 h-24 relative z-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            Bienvenido a Flux Music
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md leading-relaxed">
            Antes de comenzar, descubre cómo disfrutar de la mejor experiencia posible con Flux Music.
          </p>
        </motion.div>

        {/* MAIN CONTENT - CARDS */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* TARJETA PRINCIPAL (OBLIGATORIA) - LA EXPERIENCIA CON BRAVE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30">
              <ShieldCheck className="w-48 h-48 text-emerald-500 absolute -top-12 -right-12 blur-2xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  La experiencia completa de Flux Music
                </h2>
              </div>

              {isIOS ? (
                /* CONTENIDO iOS */
                <div className="flex flex-col gap-4">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    En iPhone y iPad, Flux Music ofrece una <strong className="text-white">experiencia nativa y sumamente fluida</strong> directamente desde <strong className="text-white">el navegador Brave</strong>.
                  </p>
                  
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-sm font-bold text-slate-200 mb-4">Con Brave en tu dispositivo disfrutarás de:</p>
                    <ul className="flex flex-col gap-3">
                      {[
                        "Reproducción fluida en segundo plano",
                        "Música con la pantalla bloqueada",
                        "Una experiencia premium sin interrupciones",
                        "Bajo consumo de batería y rendimiento óptimo",
                        "Acceso seguro e ininterrumpido"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-400 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2">
                    <button 
                      onClick={() => window.open("https://brave.com/", "_blank")}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                    >
                      <span>Instalar desde Brave</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>
              ) : (
                /* CONTENIDO ANDROID (DEFAULT) */
                <div className="flex flex-col gap-4">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    Para disfrutar de la experiencia completa de Flux Music, instala la aplicación desde <strong className="text-white">Brave (el navegador Brave)</strong>.
                  </p>
                  
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-sm font-bold text-slate-200 mb-4">Con Brave podrás disfrutar de:</p>
                    <ul className="flex flex-col gap-3">
                      {[
                        "Reproducción en segundo plano",
                        "Música con la pantalla bloqueada",
                        "Una experiencia más fluida",
                        "Acceso rápido desde tu dispositivo",
                        "Funcionamiento como una aplicación de streaming completa"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-400 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2">
                    <button 
                      onClick={() => window.open("https://brave.com/", "_blank")}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                    >
                      <span>Instalar desde Brave</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* SECCIÓN MODULAR (TARJETAS ADICIONALES) */}
          {modularCards.length > 0 && (
            <div className="flex flex-col gap-4">
              {modularCards.map((card: any, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + (index * 0.1), ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                    {card.image && (
                      <div className="w-full sm:w-32 aspect-video sm:aspect-square shrink-0 rounded-xl overflow-hidden bg-black relative border border-white/10">
                        {card.image.match(/\.(jpeg|jpg|gif|png|webp)$/i) || card.image.includes('/image/') ? (
                           <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                           <video src={card.image} controls preload="metadata" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/10 transition-colors">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{card.description}</p>
                        {card.actionText && card.actionUrl && (
                          <div className="mt-4">
                            <button
                              onClick={() => window.open(card.actionUrl, "_blank")}
                              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-2 rounded-full font-bold transition-all text-xs border border-white/5"
                            >
                              <span>{card.actionText}</span>
                              <ChevronRight className="w-3 h-3 opacity-70" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
      </div>

      {/* STICKY BOTTOM ACTIONS */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 w-full p-4 sm:p-6 pt-20 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pointer-events-none flex flex-col items-center z-50"
      >
        <div className="pointer-events-auto flex flex-col items-center w-full max-w-xl mx-auto">
          <button
            onClick={() => {
              if (hasScrolledToBottom) {
                onComplete();
              }
            }}
            disabled={!hasScrolledToBottom}
            className={`w-full px-8 py-4 sm:py-4 rounded-full font-black text-sm sm:text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              hasScrolledToBottom 
                ? "bg-white text-black hover:bg-slate-200 shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_40px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98]" 
                : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
            }`}
          >
            <span>{hasScrolledToBottom ? "Entrar en Flux Music" : "Desliza para continuar"}</span>
            {hasScrolledToBottom && <Play className="w-5 h-5 fill-black" />}
          </button>
          <p className="text-slate-500 text-[10px] sm:text-xs mt-3 sm:mt-4 font-medium text-center px-4">
            Al continuar, aceptas que Flux Music está optimizado para navegadores modernos.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
