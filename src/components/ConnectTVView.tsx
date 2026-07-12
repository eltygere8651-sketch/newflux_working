import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactPlayer from "react-player";
import {
  Tv,
  Wifi,
  Sparkles,
  Music,
  Play,
  Pause,
  Volume2,
  Mic2,
  Radio as RadioIcon,
  Loader2,
  Monitor,
  VolumeX,
} from "lucide-react";
import { FluxLogoLarge } from "./FluxLogo";
import {
  generateSessionCode,
  createReceiverSession,
  subscribeToSession,
  FluxConnectSession,
  FluxConnectState,
} from "../lib/fluxConnect";

export default function ConnectTVView() {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [session, setSession] = useState<FluxConnectSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Player state mirrored from remote controller
  const [playedSeconds, setPlayedSeconds] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const playerRef = useRef<ReactPlayer | null>(null);

  // Generate session code and initialize session on mount
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const initSession = async () => {
      try {
        const code = generateSessionCode();
        setSessionCode(code);
        await createReceiverSession(code, "Flux Smart TV");

        // Listen for remote controller connections & changes
        unsub = subscribeToSession(
          code,
          (updatedSession) => {
            if (updatedSession) {
              setSession(updatedSession);
            } else {
              // If the session document was deleted or disconnected
              setSession(null);
            }
          },
          (err) => {
            console.error("Firestore Subscribe Error:", err);
            setError("Error de conexión con el servidor. Reintentando...");
          }
        );

        setLoading(false);
      } catch (err: any) {
        console.error("Error creating receiver session:", err);
        setError("No se pudo iniciar Flux Connect. Inténtalo de nuevo.");
        setLoading(false);
      }
    };

    initSession();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const [lyrics, setLyrics] = useState<{ time: number; text: string }[] | string | null>(null);
  const [lyricsState, setLyricsState] = useState<"loading" | "found" | "not_found" | "idle">("idle");

  // Fetch lyrics automatically when in Karaoke Mode on TV
  useEffect(() => {
    const clientState = session?.clientState;
    const currentTrack = clientState?.track;

    if (clientState?.isKaraoke && currentTrack) {
      setLyrics(null);
      setLyricsState("loading");

      let query = currentTrack.title
        .replace(/karaoke|instrumental|cover|lyrics|letra|video oficial|official video/gi, "")
        .trim();
      query = query.replace(/\[.*?\]|\(.*?\)/g, "").trim();

      if (!query) {
        setLyricsState("not_found");
        return;
      }

      fetch(`/api/lyrics/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data && data.length > 0) {
            const bestMatch = data.find((d: any) => d.syncedLyrics) || data[0];
            if (bestMatch.syncedLyrics) {
              const lines = bestMatch.syncedLyrics.split("\n");
              const parsed = [];
              const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
              for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                  const min = parseInt(match[1]);
                  const sec = parseFloat(match[2]);
                  const text = match[3].trim();
                  if (text) parsed.push({ time: min * 60 + sec, text });
                }
              }
              setLyrics(parsed);
              setLyricsState("found");
            } else if (bestMatch.plainLyrics) {
              setLyrics(bestMatch.plainLyrics);
              setLyricsState("found");
            } else {
              setLyricsState("not_found");
            }
          } else {
            setLyricsState("not_found");
          }
        })
        .catch((err) => {
          console.error("Lyrics fetch error in TV View:", err);
          setLyricsState("not_found");
        });
    } else {
      setLyrics(null);
      setLyricsState("idle");
    }
  }, [session?.clientState?.isKaraoke, session?.clientState?.track?.id, session?.clientState?.track?.title]);

  // Sync seek position when remote state updates
  useEffect(() => {
    if (session?.clientState && playerRef.current) {
      const remoteTime = session.clientState.currentTime;
      // Allow slight offset of up to 3 seconds before forcing seek to prevent stuttering
      const localTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(remoteTime - localTime) > 3) {
        playerRef.current.seekTo(remoteTime, "seconds");
        setPlayedSeconds(remoteTime);
      }
    }
  }, [session?.clientState?.track?.id, session?.clientState?.updatedAt]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const qrUrl = `${window.location.origin}/?connect=${sessionCode}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=1ed760&bgcolor=050505&qzone=2&data=${encodeURIComponent(qrUrl)}`;

  if (loading) {
    return (
      <div id="tv-loading-screen" className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white font-sans">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-widest text-slate-400 uppercase">Iniciando Flux Connect...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div id="tv-error-screen" className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <Tv className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-white uppercase mb-2">Error de Conexión</h1>
        <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-full uppercase text-xs tracking-wider transition-colors cursor-pointer"
        >
          Reintentar ahora
        </button>
      </div>
    );
  }

  const [deviceType, setDeviceType] = useState<"tv" | "pc">("tv");
  const [isUiActive, setIsUiActive] = useState<boolean>(true);
  const uiTimeoutRef = useRef<any>(null);

  useEffect(() => {
    try {
      const savedType = localStorage.getItem("flux_connect_device_type");
      if (savedType === "pc" || savedType === "tv") {
        setDeviceType(savedType);
        return;
      }
    } catch (e) {
      console.warn("Storage access not allowed:", e);
    }

    const ua = navigator.userAgent.toLowerCase();
    const isTVUA = /smart-tv|smarttv|googletv|appletv|tizen|webos|hbbtv|netcast|viera|bravia|playstation|xbox|aftb|afts|firetv|roku|nintendo/i.test(ua);
    if (isTVUA) {
      setDeviceType("tv");
    } else {
      setDeviceType("pc");
    }
  }, []);

  const toggleDeviceType = () => {
    const nextType = deviceType === "tv" ? "pc" : "tv";
    setDeviceType(nextType);
    try {
      localStorage.setItem("flux_connect_device_type", nextType);
    } catch (e) {
      console.warn("Storage write not allowed:", e);
    }
  };

  useEffect(() => {
    const clientState = session?.clientState;
    if (deviceType !== "tv" || !clientState?.isKaraoke) {
      setIsUiActive(true);
      return;
    }

    const resetTimer = () => {
      setIsUiActive(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        setIsUiActive(false);
      }, 4000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [deviceType, session?.clientState?.isKaraoke, session?.clientState?.track?.id]);

  const isConnected = session?.status === "connected";
  const clientState = session?.clientState;
  const currentTrack = clientState?.track;
  const trackUrl = currentTrack
    ? (currentTrack.url || `https://www.youtube.com/watch?v=${currentTrack.id}`).replace("music.youtube.com", "www.youtube.com")
    : "";

  const renderReactPlayer = () => {
    return (
      <ReactPlayer
        ref={playerRef}
        url={trackUrl}
        playing={clientState?.isPlaying}
        volume={(clientState?.volume ?? 80) / 100}
        onProgress={(progress) => {
          setPlayedSeconds(progress.playedSeconds);
        }}
        onDuration={(d) => {
          setDuration(d);
        }}
        onEnded={() => {
          setPlayedSeconds(duration);
        }}
        onError={(err) => {
          console.error("TV ReactPlayer Error:", err);
        }}
        width="100%"
        height="100%"
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              fs: 0,
              cc_load_policy: 0,
              controls: 0,
              disablekb: 1,
              autohide: 1,
              playsinline: 1,
            },
          },
        }}
      />
    );
  };

  return (
    <div id="tv-connect-container" className="min-h-screen w-screen bg-[#050505] text-white font-sans overflow-y-auto overflow-x-hidden relative select-none">
      
      {/* 1. WAITING FOR CONNECTION SCREEN */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="waiting-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-12 lg:p-16 w-full relative z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center z-20">
              <FluxLogoLarge />
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDeviceType}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-200 transition-all pointer-events-auto cursor-pointer"
                >
                  {deviceType === "tv" ? "📺 Modo TV" : "🖥️ Modo PC"}
                </button>
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>Esperando conexión...</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
              <div className="lg:col-span-7 flex flex-col justify-center text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-4">
                  Conecta tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#1ED760]">dispositivo</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mb-8">
                  Disfruta de Flux Music en pantalla grande con sonido de alta fidelidad. Controla toda tu música, karaoke y podcasts directamente desde tu teléfono móvil de forma fluida.
                </p>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  {/* Manual Code Option */}
                  <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex flex-col items-start min-w-[240px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                      Código de Conexión
                    </span>
                    <span className="text-4xl md:text-5xl font-black text-white tracking-widest select-all font-mono">
                      {sessionCode}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2 font-bold leading-tight">
                      Introduce este código en la sección Flux Connect de tu móvil.
                    </span>
                  </div>

                  <div className="text-slate-500 font-extrabold uppercase text-xs tracking-wider md:py-4">
                    o
                  </div>

                  {/* Scan Instructions */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Escaneo de Código
                    </span>
                    <h3 className="text-base font-bold text-slate-200">
                      Escanea el código QR de la derecha
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
                      Abre la cámara de tu móvil para escanear el QR y abrir la aplicación para vincularte al instante de forma automática.
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Image Area */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative p-6 rounded-3xl bg-[#08080a] border border-white/5 shadow-2xl flex flex-col items-center group">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-[#1ED760] opacity-10 blur-xl group-hover:opacity-20 transition duration-1000"></div>
                  <img
                    src={qrImageSrc}
                    alt="Scan to Connect QR"
                    className="w-56 h-56 md:w-64 md:h-64 rounded-xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Escanea para conectar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-slate-600 text-[10px] font-bold uppercase tracking-wider">
              <span>Sincronización Premium Multidispositivo</span>
              <span>Flux Music Connect v1.0</span>
            </div>
          </motion.div>
        ) : (
          /* 2. ACTIVE SEAMLESS TV PLAYER SCREEN */
          <motion.div
            key="active-player-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-12 lg:p-16 w-full relative z-10"
          >
            {/* Ambient Background Glow matching the active track metadata */}
            {!clientState?.isKaraoke && (
              <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div
                  className="absolute -top-[40%] -left-[20%] w-[120%] h-[120%] rounded-full opacity-20 blur-[140px] transition-all duration-1000"
                  style={{
                    background: currentTrack?.thumbnail
                      ? "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(5,5,5,0) 70%)"
                      : "radial-gradient(circle, rgba(147,51,234,0.2) 0%, rgba(5,5,5,0) 70%)",
                  }}
                ></div>
                <div
                  className="absolute -bottom-[40%] -right-[20%] w-[120%] h-[120%] rounded-full opacity-15 blur-[140px] transition-all duration-1000"
                  style={{
                    background: currentTrack?.thumbnail
                      ? "radial-gradient(circle, rgba(30,215,96,0.2) 0%, rgba(5,5,5,0) 70%)"
                      : "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(5,5,5,0) 70%)",
                  }}
                ></div>
              </div>
            )}

            {/* Header of Active Screen */}
            <div className={`flex justify-between items-center z-20 transition-opacity duration-500 w-full ${(!clientState?.isKaraoke || deviceType !== "tv" || isUiActive) ? "opacity-100 animate-fade-in" : "opacity-0 pointer-events-none"}`}>
              <FluxLogoLarge />
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDeviceType}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer pointer-events-auto"
                >
                  {deviceType === "tv" ? "📺 Modo TV" : "🖥️ Modo PC"}
                </button>
                {clientState?.isKaraoke && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-fuchsia-500/30 text-[10px] font-black uppercase tracking-wider text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.15)] animate-pulse">
                    <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Modo Karaoke</span>
                  </div>
                )}
                {clientState?.isFluxRadio && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    <RadioIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Flux Radio</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-300">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Control remoto activo</span>
                </div>
              </div>
            </div>

            {/* Main view container: changes layout depending on karaoke active status */}
            {clientState?.isKaraoke ? (
              deviceType === "pc" ? (
                /* 🖥️ PC SPLIT SCREEN KARAOKE VIEW */
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full max-w-7xl mx-auto my-auto p-4 z-10">
                  
                  {/* Left Side: Video Player Frame */}
                  <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img src={currentTrack?.thumbnail || ""} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-black tracking-widest text-[#1ED760]">Cantando ahora</p>
                          <h2 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">{currentTrack?.title}</h2>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase font-black tracking-widest text-slate-400">Micrófono</p>
                        <p className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Activo
                        </p>
                      </div>
                    </div>

                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                      <div className="absolute w-[124%] h-[124%] left-[-12%] top-[-12%] pointer-events-none">
                        {renderReactPlayer()}
                      </div>
                      {/* Video masking gradients */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
                    </div>
                  </div>

                  {/* Right Side: Optimized Lyrics Panel */}
                  <div className="lg:col-span-5 flex flex-col bg-white/5 border border-white/5 rounded-3xl p-6 shadow-2xl relative min-h-[300px] justify-center items-center overflow-hidden">
                    {/* Floating background art */}
                    <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-fuchsia-500/5 blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

                    {lyricsState === "loading" && (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider animate-pulse">Sincronizando letra de Flux...</p>
                      </div>
                    )}

                    {lyricsState === "not_found" && (
                      <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
                        <div className="p-4 rounded-full bg-white/5 border border-white/10 text-slate-400">
                          <Music className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight">Sigue la letra en el reproductor</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                          No se han encontrado letras interactivas externas. Utiliza la letra integrada en el vídeo de karaoke de la izquierda.
                        </p>
                      </div>
                    )}

                    {lyricsState === "found" && Array.isArray(lyrics) && (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 overflow-y-auto max-h-[380px] premium-scrollbar">
                        {(() => {
                          const activeIndex = lyrics.findIndex(
                            (l, i) => l.time <= playedSeconds && (!lyrics[i + 1] || lyrics[i + 1].time > playedSeconds)
                          );
                          return lyrics.map((line, idx) => {
                            const isActive = idx === activeIndex;
                            const isPast = idx < activeIndex;

                            if (idx < activeIndex - 1 || idx > activeIndex + 2) return null;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                  opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
                                  scale: isActive ? 1.05 : 0.95,
                                }}
                                className={`text-center font-extrabold transition-all duration-300 px-4 leading-snug ${
                                  isActive
                                    ? "text-2xl sm:text-3xl text-[#1ED760]"
                                    : "text-lg sm:text-xl text-white/70"
                                }`}
                              >
                                {line.text}
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {lyricsState === "found" && typeof lyrics === "string" && (
                      <div className="w-full h-full relative overflow-hidden bg-black/40 rounded-2xl p-4 border border-white/5">
                        <div className="absolute inset-0 overflow-y-auto p-4 text-center font-bold text-base text-white/90 whitespace-pre-line leading-relaxed scrollbar-thin">
                          {lyrics}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 📺 IMMERSIVE TV KARAOKE VIEW WITH FULLSCREEN DESIGN */
                <div className="flex-1 flex flex-col justify-between w-full h-full z-10 relative pointer-events-none mt-4">
                  
                  {/* Floating liquid orbs of light behind lyrics for high-contrast visibility */}
                  <div className="absolute inset-0 z-[-1] overflow-hidden">
                    <div className="absolute top-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[20%] right-[20%] w-[60%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
                  </div>

                  {/* Top minimalist details */}
                  <div className={`flex items-center justify-between w-full p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 transition-opacity duration-500 ${isUiActive ? "opacity-100" : "opacity-0"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={currentTrack?.thumbnail || ""} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#1ED760]">Cantando ahora</p>
                        <h2 className="text-sm font-bold text-white truncate max-w-md">{currentTrack?.title}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Micrófono</p>
                      <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Activo
                      </p>
                    </div>
                  </div>

                  {/* Lyrics Layer - ZERO overlapping clutter in the center! */}
                  <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
                    {lyricsState === "loading" && (
                      <div className="text-xl md:text-2xl font-black text-white/70 animate-pulse bg-black/65 border border-white/5 px-8 py-4 rounded-full backdrop-blur-md shadow-2xl">
                        Cargando letras sincronizadas...
                      </div>
                    )}

                    {/* If lyrics are not found, we render ABSOLUTELY NOTHING in the center so the background video's lyrics are 100% visible! */}
                    {lyricsState === "not_found" && null}

                    {lyricsState === "found" && Array.isArray(lyrics) && (
                      <div className="w-full max-w-5xl flex flex-col items-center justify-center space-y-6">
                        {(() => {
                          const activeIndex = lyrics.findIndex(
                            (l, i) => l.time <= playedSeconds && (!lyrics[i + 1] || lyrics[i + 1].time > playedSeconds)
                          );
                          return lyrics.map((line, idx) => {
                            const isActive = idx === activeIndex;
                            const isPast = idx < activeIndex;

                            if (idx < activeIndex - 1 || idx > activeIndex + 2) return null;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{
                                  opacity: isActive ? 1 : isPast ? 0.35 : 0.6,
                                  y: 0,
                                  scale: isActive ? 1.08 : 0.96,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`text-center font-black transition-all duration-300 drop-shadow-2xl px-4 leading-tight ${
                                  isActive
                                    ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#1ED760]"
                                    : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/80"
                                }`}
                                style={{
                                  textShadow: isActive
                                    ? "0 0 20px rgba(30,215,96,0.8), 0 2px 10px rgba(0,0,0,0.95)"
                                    : "0 2px 10px rgba(0,0,0,0.9)",
                                }}
                              >
                                {line.text}
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {lyricsState === "found" && typeof lyrics === "string" && (
                      <div className="w-full max-w-3xl h-[60%] relative overflow-hidden bg-black/60 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
                        <div className="absolute inset-0 overflow-y-auto p-6 text-center font-black text-xl sm:text-2xl md:text-3xl text-white/95 whitespace-pre-line leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                          {lyrics}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* STANDARD TV MUSIC PLAYER VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center my-auto w-full max-w-6xl mx-auto z-10">
                {/* Massive Artwork Display */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative group select-none">
                    <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500 to-[#1ED760] opacity-10 blur-2xl group-hover:opacity-25 transition duration-1000"></div>
                    {currentTrack?.thumbnail ? (
                      <img
                        src={currentTrack.thumbnail.replace("default.jpg", "hqdefault.jpg")}
                        alt={currentTrack.title}
                        className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-3xl border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback image
                          (e.target as any).src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600";
                        }}
                      />
                    ) : (
                      <div className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-emerald-950 to-neutral-900 border border-white/5 rounded-3xl flex items-center justify-center text-emerald-500/50 shadow-2xl">
                        <Music className="w-24 h-24 stroke-[1.5]" />
                      </div>
                    )}

                    {/* Micro state badge: playing/paused status overlay */}
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl text-white shadow-xl flex items-center justify-center">
                      {clientState?.isPlaying ? (
                        <div className="flex gap-1 items-end h-4 w-4">
                          <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_1s_infinite_0.1s] h-4"></span>
                          <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_1s_infinite_0.3s] h-2"></span>
                          <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_1s_infinite_0.5s] h-3"></span>
                        </div>
                      ) : (
                        <Pause className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Title, Description & Metadata */}
                <div className="lg:col-span-7 flex flex-col justify-center text-left">
                  {currentTrack ? (
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Reproduciendo ahora</span>
                      </span>

                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        {currentTrack.title}
                      </h2>

                      <p className="text-xl md:text-2xl font-bold text-slate-300 tracking-wide">
                        {currentTrack.artist}
                      </p>

                      <div className="pt-6 flex items-center gap-8">
                        {/* Speaker icon and Volume status */}
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                          {clientState?.volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-emerald-500" />
                          )}
                          <span>{clientState?.volume}%</span>
                        </div>

                        {/* Code helper on TV so they can re-identify */}
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 px-3 py-1 rounded-lg">
                          Código: {sessionCode}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Tv className="w-16 h-16 text-emerald-500/40 mb-2 animate-pulse" />
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-slate-300">
                        Dispositivo Vinculado
                      </h2>
                      <p className="text-slate-400 text-sm max-w-md">
                        Tu dispositivo está conectado. Elige cualquier pista, playlist, karaoke o inicia la radio en tu móvil para comenzar la experiencia.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sync Progress Bar at the bottom */}
            <div className={`w-full space-y-2 mt-auto z-20 transition-opacity duration-500 ${(!clientState?.isKaraoke || deviceType !== "tv" || isUiActive) ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-slate-400 font-mono">
                <span>{formatTime(playedSeconds)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/[0.03]">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-[#1ED760] transition-all duration-300"
                  style={{
                    width: `${duration > 0 ? (playedSeconds / duration) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* React Player performing actual stream playback on TV */}
            {trackUrl && (
              <div
                className={
                  clientState?.isKaraoke
                    ? deviceType === "tv"
                      ? "absolute inset-0 w-full h-full z-0 overflow-hidden bg-black"
                      : "absolute -left-[9999px] top-0 w-[300px] h-[200px] overflow-hidden pointer-events-none select-none"
                    : "absolute -left-[9999px] top-0 w-[300px] h-[200px] overflow-hidden pointer-events-none select-none"
                }
              >
                <div className={(clientState?.isKaraoke && deviceType === "tv") ? "absolute w-[124%] h-[124%] left-[-12%] top-[-12%] pointer-events-none" : "w-full h-full"}>
                  {!(clientState?.isKaraoke && deviceType === "pc") && renderReactPlayer()}
                </div>
                {/* Visual mask gradients to hide YouTube watermarks/bars */}
                {clientState?.isKaraoke && deviceType === "tv" && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/95 to-transparent z-10 pointer-events-none" />
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
