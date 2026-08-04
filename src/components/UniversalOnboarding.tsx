import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FluxLogoLarge } from "./FluxLogo";
import { CheckCircle2, ChevronRight, Play, Smartphone, ShieldCheck, Sparkles, Share2, X, Send, Video, Maximize } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface UniversalOnboardingProps {
  onComplete: () => void;
  cards?: any[];
  forceIOS?: boolean;
  targetOS?: "ios" | "android" | "auto";
}

export function UniversalOnboarding({ onComplete, cards = [], forceIOS, targetOS = "auto" }: UniversalOnboardingProps) {
  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (targetOS === "ios") return true;
    if (targetOS === "android") return false;
    if (typeof forceIOS === "boolean") return forceIOS;
    return (
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream
    );
  });

  const [videoUrlAndroid, setVideoUrlAndroid] = useState<string>("");
  const [videoUrlIos, setVideoUrlIos] = useState<string>("");
  const [showQuickShareModal, setShowQuickShareModal] = useState<boolean>(false);
  const [quickShareCategory, setQuickShareCategory] = useState<string>("guia");
  const [isSharingQuick, setIsSharingQuick] = useState<boolean>(false);

  const videoRefIos = useRef<HTMLVideoElement>(null);
  const videoRefAndroid = useRef<HTMLVideoElement>(null);
  const iosLoopCountRef = useRef<number>(0);
  const androidLoopCountRef = useRef<number>(0);

  const handleToggleFullscreen = (videoElem: HTMLVideoElement | null) => {
    if (!videoElem) return;
    if (videoElem.requestFullscreen) {
      videoElem.requestFullscreen();
    } else if ((videoElem as any).webkitRequestFullscreen) {
      (videoElem as any).webkitRequestFullscreen();
    } else if ((videoElem as any).msRequestFullscreen) {
      (videoElem as any).msRequestFullscreen();
    }
  };

  const handleVideoEnded = (os: "ios" | "android") => {
    if (os === "ios") {
      iosLoopCountRef.current += 1;
      if (iosLoopCountRef.current < 2 && videoRefIos.current) {
        videoRefIos.current.currentTime = 0;
        videoRefIos.current.play().catch(() => {});
      }
    } else {
      androidLoopCountRef.current += 1;
      if (androidLoopCountRef.current < 2 && videoRefAndroid.current) {
        videoRefAndroid.current.currentTime = 0;
        videoRefAndroid.current.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const fetchOnboardingConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, "config", "onboarding"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.videoUrl_android) setVideoUrlAndroid(data.videoUrl_android);
          if (data.videoUrl_ios) setVideoUrlIos(data.videoUrl_ios);
        }
      } catch (e) {
        console.warn("Error cargando videos de onboarding:", e);
      }
    };
    fetchOnboardingConfig();
  }, []);

  const handleQuickShare = async () => {
    setIsSharingQuick(true);
    try {
      const newId = "ann_" + Math.random().toString(36).substring(2, 11);
      const isIosCurrent = isIOS;
      const title = isIosCurrent 
        ? "📱 Guía de inicio para iOS - Experiencia en Brave" 
        : "🤖 Guía de inicio para Android - Experiencia en Brave";
      const content = isIosCurrent
        ? "Flux Music funciona vía web. Usa el navegador Brave para habilitar la experiencia completa y el audio en segundo plano."
        : "Para disfrutar de la experiencia completa de Flux Music en Android, instala Flux desde el navegador Brave.";
      const videoUrl = isIosCurrent ? videoUrlIos : videoUrlAndroid;

      await setDoc(doc(db, "announcements", newId), {
        title,
        category: quickShareCategory,
        content,
        videoUrl: videoUrl || "",
        targetOS: "all",
        createdAt: new Date(),
        active: true,
      });

      let catLabel = "Guías & Uso";
      if (quickShareCategory === "actualizacion") catLabel = "Actualizaciones";
      if (quickShareCategory === "comunidad") catLabel = "Comunidad";

      alert(`¡Guía de ${isIosCurrent ? "iOS" : "Android"} compartida exitosamente en "${catLabel}"!`);
      setShowQuickShareModal(false);
    } catch (err: any) {
      alert("Error al compartir: " + err.message);
    } finally {
      setIsSharingQuick(false);
    }
  };

  useEffect(() => {
    if (targetOS === "ios") {
      setIsIOS(true);
    } else if (targetOS === "android") {
      setIsIOS(false);
    } else if (typeof forceIOS === "boolean") {
      setIsIOS(forceIOS);
    } else {
      const isIosDevice =
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
        !(window as any).MSStream;
      setIsIOS(isIosDevice);
    }
  }, [forceIOS, targetOS]);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setHasScrolledToBottom(true);
      }

      // Al desplazarse hacia abajo, activar reproducción con bucle de 2 repeticiones
      if (scrollTop > 20) {
        const activeVideo = isIOS ? videoRefIos.current : videoRefAndroid.current;
        const currentLoopCount = isIOS ? iosLoopCountRef.current : androidLoopCountRef.current;
        if (activeVideo && activeVideo.paused && currentLoopCount < 2) {
          activeVideo.play().catch(() => {});
        }
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center mb-6 pt-2"
        >
          {/* PREVIEW SHARE CONTROL BAR */}
          <div className="w-full max-w-md mx-auto mb-4 bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                {isIOS ? "📱 Vista Previa iOS" : "🤖 Vista Previa Android"}
              </span>
            </div>
            <button
              onClick={() => setShowQuickShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              title="Compartir esta guía directamente en Novedades"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir en Novedades</span>
            </button>
          </div>

          <div className="mb-3 relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[30px] rounded-full" />
            <FluxLogoLarge className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400">
            Bienvenido a Flux Music
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-md leading-relaxed px-2">
            Descubre cómo disfrutar de la mejor experiencia de audio e interacciones.
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
                  {isIOS ? "La mejor experiencia en iPhone y iPad" : "La experiencia completa de Flux Music"}
                </h2>
              </div>

              {isIOS ? (
                /* CONTENIDO iOS */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className={`flex flex-col gap-3 ${videoUrlIos ? "md:col-span-7" : "md:col-span-12"}`}>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                      Flux Music funciona vía web. Usa <strong className="text-white">el navegador Brave</strong> para habilitar la experiencia completa y el audio en segundo plano.
                    </p>
                    
                    <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5">
                      <ul className="flex flex-col gap-2">
                        {[
                          "Audio en segundo plano y pantalla bloqueada",
                          "Reproducción fluida sin cortes",
                          "Sin descargas: entra directamente a fluxplay.cc"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-1 flex justify-start sm:justify-center md:justify-start">
                      <button 
                        onClick={() => window.open("https://brave.com/", "_blank")}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-full font-bold transition-all text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <span>Obtener Brave</span>
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </button>
                    </div>
                  </div>

                  {videoUrlIos && (
                    <div className="md:col-span-5 flex justify-center w-full">
                      <div className="relative w-full max-w-[220px] sm:max-w-[240px] aspect-[9/16] rounded-[32px] p-2 bg-[#08090d] border-2 border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] group transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_20px_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col my-2 sm:my-0">
                        {/* Notch bar */}
                        <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none">
                          <div className="w-16 h-3.5 bg-black/90 rounded-full border border-white/10 flex items-center justify-end px-2 gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          </div>
                        </div>

                        {/* Botón Pantalla Completa */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFullscreen(videoRefIos.current);
                          }}
                          className="absolute top-2.5 right-2.5 z-40 p-1.5 rounded-full bg-black/80 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-white/20 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                          title="Ver en pantalla completa"
                        >
                          <Maximize className="w-3.5 h-3.5" />
                        </button>

                        {/* Video */}
                        <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-black flex items-center justify-center">
                          <video 
                            ref={videoRefIos}
                            src={videoUrlIos} 
                            controls 
                            preload="metadata" 
                            playsInline
                            onEnded={() => handleVideoEnded("ios")}
                            className="w-full h-full object-cover rounded-[24px]" 
                          />
                          {/* Overlay tag */}
                          <div className="absolute bottom-10 inset-x-2 z-20 pointer-events-none bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-2 flex items-center gap-2 shadow-lg">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                              <Video className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="overflow-hidden text-left">
                              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 block">
                                CLIP SHOWCASE • iOS
                              </span>
                              <span className="text-[10px] text-slate-200 font-bold block truncate">
                                Guía en iPhone
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CONTENIDO ANDROID (DEFAULT) */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className={`flex flex-col gap-3 ${videoUrlAndroid ? "md:col-span-7" : "md:col-span-12"}`}>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                      Para disfrutar de la experiencia completa de Flux Music en Android, instala Flux desde <strong className="text-white">el navegador Brave</strong>.
                    </p>
                    
                    <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5">
                      <p className="text-xs font-bold text-slate-200 mb-2.5">Ventajas al usar Brave:</p>
                      <ul className="flex flex-col gap-2.5">
                        {[
                          "Reproducción en segundo plano",
                          "Escucha con la pantalla bloqueada",
                          "Experiencia fluida como app nativa",
                          "Acceso directo y respuesta inmediata"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-1 flex justify-start sm:justify-center md:justify-start">
                      <button 
                        onClick={() => window.open("https://brave.com/", "_blank")}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-full font-bold transition-all text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <span>Obtener Brave</span>
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </button>
                    </div>
                  </div>

                  {videoUrlAndroid && (
                    <div className="md:col-span-5 flex justify-center w-full">
                      <div className="relative w-full max-w-[220px] sm:max-w-[240px] aspect-[9/16] rounded-[32px] p-2 bg-[#08090d] border-2 border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] group transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_20px_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col my-2 sm:my-0">
                        {/* Notch bar */}
                        <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none">
                          <div className="w-16 h-3.5 bg-black/90 rounded-full border border-white/10 flex items-center justify-end px-2 gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          </div>
                        </div>

                        {/* Botón Pantalla Completa */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFullscreen(videoRefAndroid.current);
                          }}
                          className="absolute top-2.5 right-2.5 z-40 p-1.5 rounded-full bg-black/80 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-white/20 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                          title="Ver en pantalla completa"
                        >
                          <Maximize className="w-3.5 h-3.5" />
                        </button>

                        {/* Video */}
                        <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-black flex items-center justify-center">
                          <video 
                            ref={videoRefAndroid}
                            src={videoUrlAndroid} 
                            controls 
                            preload="metadata" 
                            playsInline
                            onEnded={() => handleVideoEnded("android")}
                            className="w-full h-full object-cover rounded-[24px]" 
                          />
                          {/* Overlay tag */}
                          <div className="absolute bottom-10 inset-x-2 z-20 pointer-events-none bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-2 flex items-center gap-2 shadow-lg">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                              <Video className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="overflow-hidden text-left">
                              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 block">
                                CLIP SHOWCASE • Android
                              </span>
                              <span className="text-[10px] text-slate-200 font-bold block truncate">
                                Guía en Android
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
      {/* QUICK SHARE MODAL FOR PREVIEW */}
      {showQuickShareModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-white/15 rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Compartir Guía {isIOS ? "iOS" : "Android"} a Novedades
                </h3>
              </div>
              <button
                onClick={() => setShowQuickShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Contenido a publicar:
              </span>
              <h4 className="text-xs font-black text-white">
                {isIOS ? "📱 Guía de inicio para iOS - Experiencia en Brave" : "🤖 Guía de inicio para Android - Experiencia en Brave"}
              </h4>
              <p className="text-[11px] text-slate-300 line-clamp-2">
                {isIOS
                  ? "Flux Music funciona vía web. Usa el navegador Brave para habilitar la experiencia completa y el audio en segundo plano."
                  : "Para disfrutar de la experiencia completa de Flux Music en Android, instala Flux desde el navegador Brave."}
              </p>
              {(isIOS ? videoUrlIos : videoUrlAndroid) && (
                <span className="text-[10px] text-emerald-400 font-bold mt-1">
                  ✓ Incluye Video Guía cargado
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Selecciona la pestaña de destino en Novedades
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "guia", label: "Guías & Uso", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
                  { id: "actualizacion", label: "Actualizaciones", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
                  { id: "comunidad", label: "Comunidad", badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
                ].map((cat) => {
                  const isSelected = quickShareCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setQuickShareCategory(cat.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${cat.badge} shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-1 ring-white/30`
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowQuickShareModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickShare}
                disabled={isSharingQuick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSharingQuick ? "Publicando..." : "Publicar en Novedades"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
