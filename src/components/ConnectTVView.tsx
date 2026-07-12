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
    const initSession = async () => {
      try {
        const code = generateSessionCode();
        setSessionCode(code);
        await createReceiverSession(code, "Flux Smart TV");
        setLoading(false);

        // Listen for remote controller connections & changes
        const unsubscribe = subscribeToSession(
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

        return unsubscribe;
      } catch (err: any) {
        console.error("Error creating receiver session:", err);
        setError("No se pudo iniciar Flux Connect. Inténtalo de nuevo.");
        setLoading(false);
      }
    };

    let unsub: (() => void) | undefined;
    initSession().then((u) => {
      if (u) unsub = u;
    });

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

  const isConnected = session?.status === "connected";
  const clientState = session?.clientState;
  const currentTrack = clientState?.track;
  const trackUrl = currentTrack
    ? (currentTrack.url || `https://www.youtube.com/watch?v=${currentTrack.id}`).replace("music.youtube.com", "www.youtube.com")
    : "";

  return (
    <div id="tv-connect-container" className="h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden relative select-none">
      
      {/* 1. WAITING FOR CONNECTION SCREEN */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="waiting-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col justify-between p-12 md:p-16"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <FluxLogoLarge />
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Esperando conexión...</span>
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
            className="absolute inset-0 flex flex-col justify-between p-12 md:p-16 z-10"
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
            <div className="flex justify-between items-center z-20">
              <FluxLogoLarge />
              <div className="flex items-center gap-4">
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
              /* IMMERSIVE TV KARAOKE VIEW WITH SYNCED LYRICS AND FULLSCREEN DESIGN */
              <div className="flex-1 flex w-full h-full z-10 relative mt-0">
                
                {/* Floating liquid orbs of light behind lyrics for high-contrast visibility */}
                <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                  <div className="absolute top-[10%] left-[10%] w-[80%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px]" />
                  <div className="absolute bottom-[10%] right-[10%] w-[80%] h-[60%] rounded-full bg-cyan-500/10 blur-[150px]" />
                </div>

                {/* Top minimalist details */}
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 z-30 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                      <img src={currentTrack?.thumbnail || ""} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs uppercase font-black tracking-widest text-[#1ED760]">Cantando ahora</p>
                      <h2 className="text-sm md:text-base font-bold text-white truncate max-w-sm md:max-w-md lg:max-w-lg">{currentTrack?.title}</h2>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="hidden md:block text-right">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Modo</p>
                      <p className="text-xs font-bold text-white/80">Karaoke TV</p>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Micrófono</p>
                      <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Activo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lyrics Layer */}
                <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-8 z-20 w-full h-full relative">
                  {lyricsState === "loading" && (
                    <div className="absolute top-32 right-8 flex items-center gap-2 text-xs font-black text-white/50 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-xl">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span>Buscando letras...</span>
                    </div>
                  )}

                  {lyricsState === "found" && Array.isArray(lyrics) && (
                    <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center space-y-4 md:space-y-6">
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
                                scale: isActive ? 1.05 : 0.95,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className={`text-center font-black transition-all duration-300 drop-shadow-2xl px-6 leading-tight max-w-5xl ${
                                isActive
                                  ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1ED760]"
                                  : "text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/80"
                              }`}
                              style={{
                                textShadow: isActive
                                  ? "0 0 25px rgba(30,215,96,0.5), 0 4px 15px rgba(0,0,0,0.9)"
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
                    <div className="w-full max-w-4xl h-[70%] mt-12 relative overflow-hidden bg-black/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                      <div className="absolute inset-0 overflow-y-auto p-8 text-center font-bold text-xl sm:text-2xl md:text-3xl text-white/90 whitespace-pre-line leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                        {lyrics}
                      </div>
                    </div>
                  )}
                </div>

              </div>
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
            <div className="w-full space-y-2 mt-auto z-20">
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
                    ? "absolute inset-0 w-full h-full z-0 overflow-hidden bg-black"
                    : "absolute top-0 left-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none select-none"
                }
              >
                <div className={clientState?.isKaraoke ? "absolute w-[124%] h-[124%] left-[-12%] top-[-12%] pointer-events-none" : "w-full h-full"}>
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
                </div>
                {/* Visual mask gradients to hide YouTube watermarks/bars */}
                {clientState?.isKaraoke && (
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
