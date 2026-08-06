import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Play,
  Pause,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Clock,
  Trash2,
  Sparkles,
  PlayCircle,
  Baby,
  Lock,
  LockKeyholeOpen,
  Maximize,
  Minimize,
  ShieldCheck,
  CheckCircle2,
  Tv2,
  Film,
  Volume2,
  VolumeX,
  SkipForward,
  Youtube,
  ArrowLeft,
  Shield,
} from "lucide-react";
import ReactPlayer from "react-player";
import { useDraggable } from "../hooks/useDraggable";

const VIDEO_QUERIES = [
  "entrevistas virales recientes artistas 2025 2026",
  "entrevista Bad Bunny viral reciente 2025 2026",
  "entrevista Quevedo podcast reciente 2025 2026",
  "entrevista Rosalia viral reciente 2025 2026",
  "podcasts mas vistos virales recientes 2025 2026",
  "La Resistencia entrevista viral reciente 2025 2026",
  "El Hormiguero entrevista viral reciente 2025 2026",
  "Chente Ydrach entrevista viral reciente",
  "Ibai Llanos entrevista reciente viral",
  "entrevista Rauw Alejandro viral reciente 2025 2026",
  "entrevista Karol G viral reciente 2025 2026",
  "entrevista Feid viral reciente 2025 2026",
];

const VIDEO_CATEGORIES = [
  "Todos",
  "Continuar Viendo",
  "Infantil / Kids 🎈",
  "Entrevistas",
  "Podcasts",
  "La Resistencia",
  "El Hormiguero",
  "Bad Bunny",
  "Quevedo",
  "Rosalía",
  "Urbano",
  "Curiosidades",
];

const KIDS_SUBCATEGORIES = [
  "Recomendados para niños",
  "Dibujos",
  "Aprender jugando",
  "Música infantil",
  "Cuentos",
  "Educación",
  "Aventuras"
];

const KIDS_RECOMMENDED_QUERIES = [
  "La Granja de Zenón episodios completos recopilacion 1 hora en español",
  "La Granja de Pepito episodios completos largos español",
  "Pocoyó episodios completos largos en español 1 hora",
  "Bluey episodios completos largos en español recopilacion",
  "Cocomelon en español episodios largos completos 1 hora",
  "Mickey Mouse Casa de Mickey episodios completos largos en español",
  "Peppa Pig episodios completos en español 1 hora maratón",
  "Baby Shark canciones infantiles largas 1 hora recopilacion",
  "Luli Pampín enganchado canciones infantiles largas",
  "Plim Plim episodios completos largos español 1 hora",
  "Bichikids episodios completos largos en español",
  "Cleo y Cuquín episodios completos largos español",
  "Masha y el Oso episodios completos en español largos maraton",
  "Cuentos infantiles para dormir audiocuentos animados largos completos",
  "Aprender jugando videos educativos para niños recopilacion larga"
];

const KIDS_SUBCATEGORY_QUERIES: Record<string, string> = {
  "Recomendados para niños": "la granja de zenon pocoyo peppa pig bluey cocomelon mickey mouse plim plim episodios completos largos español 1 hora",
  "Dibujos": "caricaturas infantiles episodios completos dibujos animados disney junior en español peppa pig bluey masha y el oso cleo y cuquin",
  "Aprender jugando": "videos educativos para niños aprender jugando numeros colores formas canciones divertidas recopilacion larga",
  "Música infantil": "canciones infantiles la granja de zenon luli pampin baby shark gallina pintadita canciones para cantar y bailar niños 1 hora",
  "Cuentos": "cuentos infantiles cortos para dormir audiocuentos con moraleja animados para niños largos completos",
  "Educación": "videos educativos niños dinosaurios ciencias planetas experimentos divertidos plaza sesamo recopilacion",
  "Aventuras": "aventuras de juguetes pocoyo la granja de pepito episodios completos videos divertidos infantiles largos"
};

const getCategoryQuery = (cat: string) => {
  switch (cat) {
    case "Todos":
      return "entrevistas virales podcasts tendencia 2025 2026 recientes";
    case "Infantil / Kids 🎈":
    case "Infantil / Kids":
    case "Kids":
    case "Infantil":
      return "canciones infantiles caricaturas para niños pocoyo la granja de zenon plaza sesamo caricaturas disney junior en español";
    case "Entrevistas":
      return "entrevistas virales recientes artistas mas vistos 2025 2026";
    case "Podcasts":
      return "podcasts virales mas vistos recientes 2025 2026";
    case "La Resistencia":
      return "La Resistencia entrevista completa viral reciente 2025 2026";
    case "El Hormiguero":
      return "El Hormiguero entrevista completa viral reciente 2025 2026";
    case "Bad Bunny":
      return "Bad Bunny entrevista reciente viral podcast 2025 2026";
    case "Quevedo":
      return "Quevedo entrevista reciente viral podcast 2025 2026";
    case "Rosalía":
      return "Rosalía entrevista reciente viral podcast 2025 2026";
    case "Urbano":
      return "entrevistas musica urbana reggaeton virales recientes";
    case "Curiosidades":
      return "curiosidades noticias mas virales recientes famosos";
    default:
      return `${cat} entrevista viral reciente 2025 2026`;
  }
};

interface VideoItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number | string;
  savedTime?: number;
}

const ActivePlayerControlBar = ({
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  isFullscreen,
  toggleFullscreen,
  isBabyLock,
  setIsBabyLock,
  played,
  onSeekMouseDown,
  onSeekChange,
  onSeekMouseUp,
  duration,
  currentTime,
  onNext,
  isOverlay = false,
}: {
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isBabyLock: boolean;
  setIsBabyLock: (val: boolean) => void;
  played: number;
  onSeekMouseDown: () => void;
  onSeekChange: (val: number) => void;
  onSeekMouseUp: (val: number) => void;
  duration: number;
  currentTime: number;
  onNext?: () => void;
  isOverlay?: boolean;
}) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh > 0) return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    return `${mm}:${ss}`;
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex flex-col gap-2 ${
        isOverlay 
          ? "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent backdrop-blur-md z-50 transition-all duration-300 pointer-events-auto" 
          : "p-3 rounded-b-2xl bg-slate-900 border-x border-b border-white/10 backdrop-blur-lg shadow-2xl"
      } overflow-hidden`}
    >
      {/* Progress Bar & Time */}
      <div className="flex flex-col gap-1 w-full group/seek">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-white/80 mb-0.5">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <span className="text-red-500 animate-pulse">●</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="relative h-6 flex items-center w-full">
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={onSeekMouseDown}
            onChange={(e) => onSeekChange(parseFloat(e.target.value))}
            onMouseUp={(e) => onSeekMouseUp(parseFloat((e.target as any).value))}
            onTouchStart={onSeekMouseDown}
            onTouchEnd={(e) => onSeekMouseUp(parseFloat((e.target as any).value))}
            className="absolute inset-0 w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-600 z-10"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-red-600 rounded-lg transition-all pointer-events-none"
            style={{ width: `${played * 100}%` }}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left: Play/Pause/Next Group */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-white/10"
            title="Siguiente video"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Right: Volume & Fullscreen & Baby Lock */}
        <div className="flex items-center gap-2">
          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5 hover:bg-white/10 transition-all">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                setVolume(parseFloat(e.target.value));
              }}
              className="w-14 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-white/10"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBabyLock(true);
            }}
            className="w-9 h-9 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-red-500/20"
            title="Bloqueo Infantil"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoPlayerWithControls = ({
  displayVideo,
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  isBabyLock,
  setIsBabyLock,
  played,
  duration,
  onProgress,
  onDuration,
  onSeekMouseDown,
  onSeekChange,
  onSeekMouseUp,
  onEnded,
  onReady,
  playerRef,
  fullscreenId,
  toggleFullscreen,
  showControls,
  resetControlsTimeout,
}: any) => {
  const isFS = !!fullscreenId;

  const playerContent = (
    <div
      id={`player-card-${displayVideo.id}`}
      className={`relative w-full transition-all duration-300 ${isFS ? "fixed inset-0 z-[9999] h-full" : "aspect-video h-auto rounded-t-xl"} bg-slate-950 group/player overflow-hidden`}
      style={isFS ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' } : {}}
      onClick={() => {
        if (!isBabyLock) resetControlsTimeout();
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={`https://www.youtube.com/watch?v=${displayVideo.id}`}
        width="100%"
        height="100%"
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        muted={isMuted}
        onProgress={onProgress}
        onDuration={onDuration}
        onReady={onReady}
        onEnded={onEnded}
        onError={() => {
          if (onEnded) onEnded();
        }}
        controls={false}
        playsinline
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              cc_load_policy: 0,
              fs: 0,
              playsinline: 1,
              disablekb: 1,
              origin: typeof window !== "undefined" ? window.location.origin : undefined,
            },
          },
        }}
      />

      {/* Top Mask to hide YouTube title/links */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-0 opacity-60" />

      {/* Central Play/Pause on Tap Overlay */}
      {!isBabyLock && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
            resetControlsTimeout();
          }}
          onMouseMove={resetControlsTimeout}
          className={`absolute inset-0 z-10 cursor-pointer flex items-center justify-center transition-all ${
            showControls ? "bg-black/40" : "bg-transparent"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-lg transition-all transform ${
              showControls || !isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-90"
            } shadow-2xl border border-white/20`}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current ml-1.5" />
            )}
          </div>
        </div>
      )}

      {/* Control Bar Overlay (Only in Fullscreen) */}
      {!isBabyLock && isFS && (
        <div
          onMouseMove={resetControlsTimeout}
          className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <ActivePlayerControlBar
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            volume={volume}
            setVolume={setVolume}
            isFullscreen={isFS}
            toggleFullscreen={() => toggleFullscreen(`player-card-${displayVideo.id}`)}
            isBabyLock={isBabyLock}
            setIsBabyLock={setIsBabyLock}
            played={played}
            onSeekMouseDown={onSeekMouseDown}
            onSeekChange={onSeekChange}
            onSeekMouseUp={onSeekMouseUp}
            duration={duration}
            currentTime={played * duration}
            onNext={onEnded}
            isOverlay={true}
          />
        </div>
      )}

      {isBabyLock && <BabyLockOverlay onUnlock={() => setIsBabyLock(false)} />}
    </div>
  );

  const isNativeFS = typeof document !== 'undefined' && !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
  if (isFS && !isNativeFS && typeof document !== 'undefined') {
    return createPortal(playerContent, document.body);
  }

  return playerContent;
};

const POSITIONS_KEY = "flux_video_positions";
const HISTORY_KEY = "flux_video_history";

const formatDurationDisplay = (val?: number | string): string => {
  if (val === undefined || val === null || val === "N/A" || val === "") return "";
  if (typeof val === "number") {
    if (isNaN(val) || val < 0) return "";
    const date = new Date(val * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh > 0) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  }
  if (typeof val === "string") {
    const clean = val.trim();
    if (clean === "N/A") return "";
    return clean;
  }
  return "";
};

const parseDurationSeconds = (val?: number | string): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parts = val.split(":").map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return 0;
};

const getVideoClassificationInfo = (video: VideoItem, activeCat: string) => {
  const titleLower = (video.title || "").toLowerCase();
  const artistLower = (video.artist || "").toLowerCase();
  const catLower = (activeCat || "").toLowerCase();

  const isKidsCat = catLower.includes("infantil") || catLower.includes("kids");

  const kidsKeywords = [
    "pocoyo",
    "zenon",
    "granja",
    "niños",
    "niño",
    "infantil",
    "canciones infantiles",
    "dibujos",
    "caricatura",
    "caricaturas",
    "baby",
    "kid",
    "kids",
    "disney",
    "plaza sesamo",
    "plim plim",
    "chuchuwa",
    "luli pampin",
    "cantando",
    "aprender",
    "educativo",
    "masha",
  ];
  const isKidsContent =
    isKidsCat || kidsKeywords.some((k) => titleLower.includes(k) || artistLower.includes(k));

  if (isKidsContent) {
    return {
      isKids: true,
      categoryTag: "Infantil • Safe Kids 🛡️",
      qualityBadge: "Safe Kids 🛡️",
      badgeClass: "bg-amber-500/90 text-black border-amber-400/80 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]",
      tagClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold",
      ageRating: "Apto para todo público (0-10)",
    };
  }

  if (
    titleLower.includes("podcast") ||
    artistLower.includes("podcast") ||
    titleLower.includes("episodio") ||
    catLower.includes("podcast")
  ) {
    return {
      isKids: false,
      categoryTag: "Podcast 🎙️",
      qualityBadge: "Podcast HD",
      badgeClass: "bg-purple-600/90 text-white border-purple-400/80 font-black shadow-[0_0_12px_rgba(168,85,247,0.4)]",
      tagClass: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold",
      ageRating: "Podcast oficial",
    };
  }

  if (
    titleLower.includes("entrevista") ||
    titleLower.includes("interview") ||
    titleLower.includes("resistencia") ||
    titleLower.includes("hormiguero") ||
    catLower.includes("entrevista")
  ) {
    return {
      isKids: false,
      categoryTag: "Entrevista 💬",
      qualityBadge: "4K Ultra HD",
      badgeClass: "bg-blue-600/90 text-white border-blue-400/80 font-black shadow-[0_0_12px_rgba(59,130,246,0.4)]",
      tagClass: "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold",
      ageRating: "Entrevista exclusiva",
    };
  }

  if (
    titleLower.includes("oficial") ||
    titleLower.includes("video oficial") ||
    titleLower.includes("reggaeton") ||
    titleLower.includes("urbano") ||
    catLower.includes("urbano")
  ) {
    return {
      isKids: false,
      categoryTag: "Música Urbana 🎵",
      qualityBadge: "HD 1080p",
      badgeClass: "bg-rose-600/90 text-white border-rose-400/80 font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]",
      tagClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold",
      ageRating: "Música & Tendencia",
    };
  }

  return {
    isKids: false,
    categoryTag: "HD 🎬",
    qualityBadge: "HD 1080p",
    badgeClass: "bg-emerald-600/90 text-white border-emerald-400/80 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    tagClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
    ageRating: "Alta definición",
  };
};

export const getHighResVideoThumbnail = (url?: string, videoId?: string): string => {
  if (url && typeof url === "string") {
    let clean = url.trim();
    if (clean.includes("i.ytimg.com")) {
      clean = clean.split("?")[0];
      if (
        clean.endsWith("default.jpg") ||
        clean.endsWith("mqdefault.jpg") ||
        clean.endsWith("sddefault.jpg")
      ) {
        return clean.replace(/(default|mqdefault|sddefault)\.jpg$/, "hqdefault.jpg");
      }
      return clean;
    }
    if (clean.includes("googleusercontent.com")) {
      return clean.replace(/=w\d+-h\d+/, "=w800-h800").replace(/=s\d+/, "=s800");
    }
    if (clean.length > 5) return clean;
  }
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return "";
};

const BabyLockOverlay: React.FC<{
  onUnlock: () => void;
}> = ({ onUnlock }) => {
  const [tapCount, setTapCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  const handleTap = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const now = Date.now();
    
    // Prevent duplicate touchstart + click events from firing within 120ms
    if (now - lastTapTimeRef.current < 120) {
      return;
    }

    const timeSinceLastTap = lastTapTimeRef.current > 0 ? now - lastTapTimeRef.current : 0;
    lastTapTimeRef.current = now;

    setShowBadge(true);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => {
      setShowBadge(false);
    }, 2000);

    // If more than 650ms elapsed since the previous tap, reset sequence to 1
    if (timeSinceLastTap > 650) {
      setTapCount(1);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 600);
      return;
    }

    const nextCount = tapCount + 1;
    if (nextCount >= 10) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      setShowBadge(false);
      setTapCount(0);
      onUnlock();
      return;
    }

    setTapCount(nextCount);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 600); // 10 rapid consecutive taps required (<600ms apart)
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 bg-transparent pointer-events-auto select-none overflow-hidden cursor-pointer"
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {showBadge && (
        <div 
          className="absolute inset-x-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-3 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: "calc(16px + env(safe-area-inset-top, 0px))" }}
        >
          <div className="bg-black/90 backdrop-blur-2xl border border-amber-500/60 text-amber-300 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
            <Baby className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10.5px] leading-tight text-white font-black uppercase tracking-wider">
                🔒 Modo Bebé Activo
              </span>
              <span className="text-[9.5px] text-amber-300/80 leading-tight font-medium">
                Controles protegidos
              </span>
            </div>
            <div className="flex items-center gap-1 ml-2.5 bg-black/50 px-2 py-1 rounded-full border border-white/10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                <div
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                    step <= tapCount
                      ? "bg-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                      : "bg-white/20 border border-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const VideoView = ({
  isVisible,
  pauseBackgroundMusic,
  onClose,
}: {
  isVisible: boolean;
  pauseBackgroundMusic: () => void;
  onClose?: () => void;
}) => {
  const [immersiveModeSelection, setImmersiveModeSelection] = useState<'select' | 'videos' | 'kids'>('select');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [previousCategory, setPreviousCategory] = useState("Todos");
  const [activeKidsSubCategory, setActiveKidsSubCategory] = useState("Recomendados para niños");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activePlayerContainerId, setActivePlayerContainerId] = useState<string | null>(null);
  const [isPlayerInView, setIsPlayerInView] = useState(true);
  const [videoHistory, setVideoHistory] = useState<VideoItem[]>([]);

  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBabyLock, setIsBabyLock] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isBabyLock) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    if (showControls && isPlaying && !isBabyLock) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isBabyLock]);

  useEffect(() => {
    const handleFS = () => {
      const activeFS = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!activeFS) {
        setFullscreenId(null);
        if (typeof window !== "undefined" && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
          try {
            (window.screen as any).orientation.unlock();
          } catch (e) {}
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFS);
    document.addEventListener("webkitfullscreenchange", handleFS);
    return () => {
      document.removeEventListener("fullscreenchange", handleFS);
      document.removeEventListener("webkitfullscreenchange", handleFS);
    };
  }, []);

  const toggleFullscreen = (containerId: string) => {
    const el = document.getElementById(containerId);
    if (!el) return;

    const isActuallyFullscreen = document.fullscreenElement === el || (document as any).webkitFullscreenElement === el;
    const isPseudoFullscreen = fullscreenId === containerId;

    if (isActuallyFullscreen || isPseudoFullscreen) {
      // EXIT
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setFullscreenId(null);
      if (typeof window !== "undefined" && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
        try { (window.screen as any).orientation.unlock(); } catch (e) {}
      }
    } else {
      // ENTER
      const requestFS = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
      if (requestFS) {
        try {
          const promise = requestFS.call(el);
          if (promise && typeof promise.then === 'function') {
            promise.then(() => {
              setFullscreenId(containerId);
              if (typeof window !== "undefined" && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
                (window.screen as any).orientation.lock("landscape").catch(() => {});
              }
            }).catch(() => {
              // Fallback for iOS
              setFullscreenId(containerId);
            });
          } else {
            setFullscreenId(containerId);
          }
        } catch (e) {
          setFullscreenId(containerId);
        }
      } else {
        // Fallback for iOS iPhone where API is missing
        setFullscreenId(containerId);
      }
    }
  };

  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const initialSeekTimeRef = useRef<number>(0);
  const lastSavedTimeRef = useRef<number>(0);

  useDraggable(historyScrollRef);

  // Observer to track if the active playing element is visible
  useEffect(() => {
    if (!playingId || isMinimized || !currentVideo) {
      setIsPlayerInView(true);
      return;
    }

    const el = document.getElementById(playingId);
    if (!el) {
      setIsPlayerInView(false);
      return;
    }

    // Scroll to the active video automatically when it changes (for continuous play)
    if (currentVideo) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [playingId, isMinimized, currentVideo, activeCategory]);

  useEffect(() => {
    if (!isVisible) return;
    loadHistory();
    if (immersiveModeSelection === 'videos' && videos.length === 0) {
      loadRecommendations();
    } else if (immersiveModeSelection === 'kids' && videos.length === 0) {
      fetchVideosForQuery(KIDS_SUBCATEGORY_QUERIES["Recomendados para niños"]);
    }
  }, [isVisible, immersiveModeSelection]);

  const selectNormalVideosMode = async () => {
    setImmersiveModeSelection('videos');
    setActiveCategory('Todos');
    setSearchQuery('');
    await loadRecommendations();
  };

  const selectKidsMode = async () => {
    setImmersiveModeSelection('kids');
    setActiveCategory('Infantil / Kids 🎈');
    setActiveKidsSubCategory('Recomendados para niños');
    setSearchQuery('');
    await fetchVideosForQuery(KIDS_SUBCATEGORY_QUERIES["Recomendados para niños"]);
  };

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        setVideoHistory(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(POSITIONS_KEY);
      setVideoHistory([]);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollHistory = (direction: "left" | "right") => {
    if (historyScrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      historyScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const getSavedPositions = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(POSITIONS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveVideoProgress = (video: VideoItem, seconds: number) => {
    if (!video || isNaN(seconds)) return;
    try {
      const floorSecs = Math.max(0, Math.floor(seconds));
      const positions = getSavedPositions();
      
      if (floorSecs === 0) {
        delete positions[video.id];
      } else {
        positions[video.id] = floorSecs;
      }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));

      // Update History List
      const historyRaw = localStorage.getItem(HISTORY_KEY);
      const historyList: VideoItem[] = historyRaw ? JSON.parse(historyRaw) : [];
      const existingIdx = historyList.findIndex((item) => item.id === video.id);

      const updatedItem: VideoItem = {
        ...video,
        thumbnail: getHighResVideoThumbnail(video.thumbnail, video.id),
        savedTime: floorSecs,
      };

      if (existingIdx >= 0) {
        historyList.splice(existingIdx, 1);
      }
      historyList.unshift(updatedItem);

      const slicedHistory = historyList.slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(slicedHistory));
      setVideoHistory(slicedHistory);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTitle = (title: string) => {
    return title
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  };

  const fetchVideosForQuery = async (queryText: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(queryText)}&limit=24&type=video`,
      );
      if (res.ok) {
        const data = await res.json();
        const isForKids = isKidsMode || activeCategory === "Infantil / Kids 🎈";

        const filtered = data.filter((v: any) => {
          const titleLower = (v.title || "").toLowerCase();

          // Exclude unavailable / unplayable / restricted video titles
          if (
            titleLower.includes("vol. 2") ||
            titleLower.includes("vol 2") ||
            titleLower.includes("volumen 2") ||
            titleLower.includes("unavailable") ||
            titleLower.includes("no disponible")
          ) {
            return false;
          }

          // Basic music audio/lyrics filters
          if (
            titleLower.includes("audio oficial") ||
            titleLower.includes("letra") ||
            titleLower.includes("lyric")
          ) {
            return false;
          }

          // Strict filtering for Kids Mode: exclude Shorts, promos, teasers, and short clips (< 3 mins)
          if (isForKids) {
            if (
              titleLower.includes("shorts") ||
              titleLower.includes("#shorts") ||
              titleLower.includes("#short") ||
              titleLower.includes("promo") ||
              titleLower.includes("teaser") ||
              titleLower.includes("tráiler") ||
              titleLower.includes("trailer") ||
              titleLower.includes("avance") ||
              titleLower.includes("fragmento")
            ) {
              return false;
            }

            if (v.duration) {
              const secs = parseDurationSeconds(v.duration);
              if (secs > 0 && secs < 180) { // Exclude short clips under 3 minutes
                return false;
              }
            }
          }

          return true;
        });

        setVideos(
          filtered.map((v: any) => ({
            id: v.id,
            title: formatTitle(v.title),
            artist: v.artist || v.uploader || (isForKids ? "Flux Kids" : "YouTube"),
            thumbnail: getHighResVideoThumbnail(v.thumbnail, v.id),
            duration: v.duration || undefined,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    const query =
      VIDEO_QUERIES[Math.floor(Math.random() * VIDEO_QUERIES.length)];
    await fetchVideosForQuery(query);
  };

  const handleCategorySelect = async (cat: string) => {
    if (cat === "Infantil / Kids 🎈") {
      setPreviousCategory(activeCategory);
    }
    setActiveCategory(cat);
    if (cat === "Todos") {
      setSearchQuery("");
      await loadRecommendations();
    } else if (cat === "Continuar Viendo") {
      setSearchQuery("");
      setVideos([]); // Clear videos to just show history
    } else if (cat === "Infantil / Kids 🎈") {
      setSearchQuery("");
      setActiveKidsSubCategory("Recomendados para niños");
      const query = KIDS_RECOMMENDED_QUERIES[Math.floor(Math.random() * KIDS_RECOMMENDED_QUERIES.length)];
      await fetchVideosForQuery(query);
    } else {
      setSearchQuery(cat);
      const catQuery = getCategoryQuery(cat);
      await fetchVideosForQuery(catQuery);
    }
  };

  const handleExitKidsMode = async () => {
    setSearchQuery("");
    await handleCategorySelect(previousCategory || "Todos");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (activeCategory === "Infantil / Kids 🎈") {
      // Keep kids mode active and execute a safe filtered search
      const safeKidsQuery = `${trimmed} infantil para niños dibujos caricaturas`;
      await fetchVideosForQuery(safeKidsQuery);
    } else {
      setActiveCategory("");
      await fetchVideosForQuery(trimmed);
    }
  };

  const playNextVideo = () => {
    if (!currentVideo) return;
    
    // Clear progress for the video that just finished
    saveVideoProgress(currentVideo, 0);
    
    const activeList = activeCategory === "Continuar Viendo" ? videoHistory : videos;
    const sourcePrefix = activeCategory === "Continuar Viendo" ? "hist" : "grid";
    
    const currentIndex = activeList.findIndex(v => v.id === currentVideo.id);
    
    // Reset states for the new video
    setPlayed(0);
    setDuration(0);

    if (currentIndex !== -1 && currentIndex < activeList.length - 1) {
      const nextVid = activeList[currentIndex + 1];
      
      const positions = getSavedPositions();
      const savedSecs = positions[nextVid.id] || nextVid.savedTime || 0;
      initialSeekTimeRef.current = savedSecs;
      
      const nextSourceId = `${sourcePrefix}-${nextVid.id}`;
      setCurrentVideo(nextVid);
      setPlayingId(nextSourceId);
      
      // If NOT in fullscreen, move the player container to the new card
      // If IN fullscreen, keep the player container stable to preserve fullscreen
      if (!fullscreenId) {
        setActivePlayerContainerId(nextSourceId);
      }
      
      setIsPlaying(true);
    } else if (activeList.length > 0) {
      // Continuous autoplay sequence: loop back to start or first video
      const nextVid = activeList[0];
      const positions = getSavedPositions();
      const savedSecs = positions[nextVid.id] || nextVid.savedTime || 0;
      initialSeekTimeRef.current = savedSecs;

      const nextSourceId = `${sourcePrefix}-${nextVid.id}`;
      setCurrentVideo(nextVid);
      setPlayingId(nextSourceId);

      if (!fullscreenId) {
        setActivePlayerContainerId(nextSourceId);
      }

      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentVideo(null);
      setPlayingId(null);
    }
  };

  const handlePlayVideo = (video: VideoItem, sourceId: string) => {
    pauseBackgroundMusic();
    const positions = getSavedPositions();
    const savedSecs = positions[video.id] || video.savedTime || 0;

    initialSeekTimeRef.current = savedSecs;
    setCurrentVideo(video);
    setPlayingId(sourceId);
    setActivePlayerContainerId(sourceId);
    setIsPlaying(true);
    setIsMinimized(false);
  };

  const scrollToActiveVideo = () => {
    if (!playingId) return;
    const el = document.getElementById(playingId);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
    } else {
      // If the element is no longer in the DOM (e.g. they searched for something else)
      // fallback to minimizing it so they can see it
      setIsMinimized(true);
    }
  };

  const handleMinimize = () => {
    setIsPlaying(false);
    setIsMinimized(true);
  };

  const handleExpand = () => {
    setIsMinimized(false);
    setIsPlaying(true);
  };

  const formatTime = (seconds?: number) => {
    if (
      seconds === undefined ||
      seconds === null ||
      isNaN(seconds) ||
      seconds < 0
    )
      return "";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loadedSeconds: number;
  }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
    const secs = state.playedSeconds;
    
    // Don't save progress if we're in the last 10 seconds or 98% of the video
    const isNearEnd = duration > 0 && (duration - secs < 10 || state.played > 0.98);

    if (currentVideo && secs > 1 && !isNearEnd) {
      if (Math.abs(secs - lastSavedTimeRef.current) >= 2) {
        lastSavedTimeRef.current = secs;
        saveVideoProgress(currentVideo, secs);
      }
    } else if (currentVideo && isNearEnd) {
      // Clear progress when nearly finished to avoid end-of-video loop on restart
      if (lastSavedTimeRef.current !== 0) {
        lastSavedTimeRef.current = 0;
        saveVideoProgress(currentVideo, 0);
      }
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (val: number) => {
    setPlayed(val);
  };

  const handleSeekMouseUp = (val: number) => {
    setSeeking(false);
    playerRef.current?.seekTo(val);
  };

  const handlePlayerReady = () => {
    if (initialSeekTimeRef.current && initialSeekTimeRef.current > 2) {
      playerRef.current?.seekTo(initialSeekTimeRef.current, "seconds");
      initialSeekTimeRef.current = 0;
    }
  };

  if (!isVisible) return null;

  const isKidsMode = immersiveModeSelection === 'kids';
  const categoriesToShow = VIDEO_CATEGORIES.filter((cat) => cat !== "Infantil / Kids 🎈");

  if (immersiveModeSelection === 'select') {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-[#060814] text-white flex flex-col justify-between p-4 sm:p-12 overflow-y-auto font-sans selection:bg-amber-500 selection:text-black">
        {/* Top Header with Back/Close button */}
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto pt-2 sm:pt-0">
          <div className="flex items-center gap-2.5 sm:gap-3 select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.25)]">
              <Tv2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 uppercase">
                Flux Cinema
              </span>
              <span className="block text-[9px] sm:text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
                Premium Streaming
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer shadow-md group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Volver</span>
          </button>
        </div>

        {/* Center Prompt & Cards */}
        <div className="flex-1 flex flex-col items-center justify-center my-2 sm:my-8 max-w-5xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-12 space-y-1 sm:space-y-2 max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight select-none px-4">
              ¿Qué deseas ver hoy?
            </h1>
            <p className="text-[10px] sm:text-sm text-slate-400 font-semibold select-none">
              Elige tu perfil de entretenimiento inmersivo exclusivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8 w-full max-w-3xl px-2 sm:px-4">
            {/* Card 1: 🎬 Vídeos Normal */}
            <button
              onClick={selectNormalVideosMode}
              className="group relative flex flex-col items-center justify-center text-center p-4 sm:p-10 rounded-[24px] sm:rounded-3xl bg-[#0d0e1e]/60 border border-white/10 hover:border-red-500/40 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-red-500/5 select-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent rounded-[24px] sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-lg group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 mb-3 sm:mb-6">
                <Play className="w-5 h-5 sm:w-8 sm:h-8 fill-current ml-1" />
              </div>

              <h3 className="text-base sm:text-2xl font-black text-white tracking-tight group-hover:text-red-400 transition-colors leading-none mb-1.5 sm:mb-3">
                Flux Vídeos 🎬
              </h3>
              <p className="text-[10px] sm:text-sm text-slate-400 font-semibold max-w-[260px] leading-relaxed">
                Música, podcasts, entrevistas y contenido exclusivo en alta definición
              </p>
            </button>

            {/* Card 2: 👶 Infantil / Kids */}
            <button
              onClick={selectKidsMode}
              className="group relative flex flex-col items-center justify-center text-center p-4 sm:p-10 rounded-[24px] sm:rounded-3xl bg-[#0d0e1e]/60 border border-white/10 hover:border-amber-500/40 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-amber-500/5 select-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-[24px] sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg group-hover:bg-amber-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 mb-3 sm:mb-6">
                <Baby className="w-5 h-5 sm:w-8 sm:h-8 animate-bounce" />
              </div>

              <h3 className="text-base sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors leading-none mb-1.5 sm:mb-3">
                Flux Kids 🎈
              </h3>
              <p className="text-[10px] sm:text-sm text-slate-400 font-semibold max-w-[260px] leading-relaxed">
                Caricaturas, música, cuentos animados y aprendizaje seguro para niños
              </p>
            </button>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div className="text-center w-full max-w-5xl mx-auto py-2">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase select-none">
            Flux Music • Conectando Familias de Manera Segura
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] h-screen w-screen flex flex-col overflow-hidden selection:bg-red-500 selection:text-white ${isKidsMode ? "bg-gradient-to-br from-sky-200 via-teal-100 to-sky-100 text-slate-800" : "bg-[#020204] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050508] to-[#020204] text-white"}`}>
      {/* Release Announcement Banner */}
      {!isKidsMode && Date.now() - 1754332578000 < 24 * 60 * 60 * 1000 && (
        <div className="shrink-0 bg-red-600/10 border-b border-red-500/20 px-4 pb-2 pt-[max(env(safe-area-inset-top),8px)] flex items-center justify-between gap-3 backdrop-blur-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight">
                ¡Nueva Sección de Vídeos HD! 🎬
              </p>
              <p className="text-[10px] font-bold text-red-400/80 leading-tight">
                Disfruta de tus temas favoritos con controles Premium.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black bg-white text-red-600 px-1.5 py-0.5 rounded-md animate-pulse">
              HOT
            </span>
          </div>
        </div>
      )}
      
      {/* Search & Category Filter Sticky Header */}
      {isKidsMode ? (
        <div className={`shrink-0 sticky top-0 z-40 bg-white/60 backdrop-blur-3xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300 pb-3 pt-[max(env(safe-area-inset-top),16px)]`}>
          <div className="flex flex-col gap-3 max-w-7xl mx-auto w-full px-4 sm:px-6">
            {/* Top row with Premium back button, Brand Logo and Perfiles */}
            <div className="relative flex items-center justify-between min-h-[44px]">
              <div className="flex items-center z-10 w-1/3 justify-start">
                <button
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-rose-400 text-rose-500 bg-white hover:bg-rose-50 hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm group active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-transparent bg-clip-text drop-shadow-sm">
                  <Baby className="w-5 h-5 text-amber-500" />
                  <span className="text-base sm:text-lg font-black tracking-widest uppercase leading-none mt-0.5">
                    Flux Kids
                  </span>
                </div>
              </div>

              <div className="flex items-center z-10 w-1/3 justify-end">
                <button
                  onClick={() => setImmersiveModeSelection('select')}
                  className="flex items-center justify-center h-10 sm:h-11 px-4 sm:px-5 rounded-full border-2 border-sky-400 text-sky-600 bg-white hover:bg-sky-50 hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">Perfiles</span>
                </button>
              </div>
            </div>

            {/* Playful Kids Search bar */}
            <form onSubmit={handleSearch} className="relative w-full mt-1">
              <input
                type="text"
                placeholder="Buscar caricaturas, canciones, cuentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-sky-200 rounded-full h-12 sm:h-14 pl-12 pr-10 text-sm sm:text-base font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all shadow-sm"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveKidsSubCategory("Recomendados para niños");
                    fetchVideosForQuery(KIDS_SUBCATEGORY_QUERIES["Recomendados para niños"]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1.5 cursor-pointer bg-slate-100 hover:bg-rose-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Kids subcategories filter pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1 pt-1 touch-pan-x">
              {KIDS_SUBCATEGORIES.map((subCat) => {
                const isSelected = activeKidsSubCategory === subCat;
                return (
                  <button
                    key={subCat}
                    onClick={async () => {
                      setActiveKidsSubCategory(subCat);
                      const query = KIDS_SUBCATEGORY_QUERIES[subCat];
                      await fetchVideosForQuery(query);
                    }}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap border-2 flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-transparent shadow-lg shadow-orange-400/30 scale-105"
                        : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 shadow-sm"
                    }`}
                  >
                    👶 {subCat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className={`shrink-0 sticky top-0 z-40 bg-[#020204]/80 backdrop-blur-3xl shadow-2xl border-b border-white/5 transition-all duration-300 pb-2.5 ${!isKidsMode && Date.now() - 1754332578000 < 24 * 60 * 60 * 1000 ? 'pt-2' : 'pt-[max(env(safe-area-inset-top),12px)]'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full px-3 sm:px-4 relative z-10">
            {/* Top row with Premium back button, Brand Logo and Perfiles */}
            <div className="relative flex items-center justify-between min-h-[44px]">
              <div className="flex items-center z-10 w-1/3 justify-start">
                <button
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 cursor-pointer shadow-sm group active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 drop-shadow-md">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span className="text-sm sm:text-base font-black tracking-widest text-white uppercase leading-none mt-0.5 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                    Flux Vídeos
                  </span>
                </div>
              </div>

              <div className="flex items-center z-10 w-1/3 justify-end">
                <button
                  onClick={() => setImmersiveModeSelection('select')}
                  className="flex items-center justify-center h-9 sm:h-10 px-3 sm:px-4 rounded-full border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">Perfiles</span>
                </button>
              </div>
            </div>

            {/* Full Width Search Input */}
            <form onSubmit={handleSearch} className="relative w-full mt-0.5">
              <input
                type="text"
                placeholder="Buscar vídeos, entrevistas, podcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-full h-10 sm:h-11 pl-10 pr-9 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-rose-500/50 focus:bg-black/60 transition-all shadow-inner placeholder:text-slate-400"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("Todos");
                    loadRecommendations();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Touch-Friendly Category Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 pt-0.5 touch-pan-x">
              {categoriesToShow.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center justify-center border ${
                      isSelected
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-[1.02]"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Scrollable Feed */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 pb-36 sm:pb-32 relative space-y-6 sm:space-y-8">
        {/* Minimized Floating Player Dock */}
        {currentVideo && isMinimized && (
          <div
            ref={playerContainerRef}
            className="fixed bottom-[62px] left-2 right-2 sm:left-auto sm:right-6 sm:bottom-6 z-[70] sm:w-[380px] h-16 bg-[#121218]/95 border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex items-center px-3 py-2 gap-3 transition-all duration-300 animate-in slide-in-from-bottom-3"
          >
            <div className="w-full h-full flex items-center gap-2.5 min-w-0">
              <div
                onClick={handleExpand}
                className="relative h-full aspect-video shrink-0 bg-black rounded-xl overflow-hidden border border-white/15 cursor-pointer group shadow-md"
                title="Ampliar vídeo"
              >
                <ReactPlayer
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                  width="100%"
                  height="100%"
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  playing={isPlaying}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  onReady={handlePlayerReady}
                  onEnded={playNextVideo}
                  onError={playNextVideo}
                  controls={false}
                  playsinline
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0,
                        modestbranding: 1,
                        rel: 0,
                        iv_load_policy: 3,
                        cc_load_policy: 0,
                        fs: 0,
                        playsinline: 1,
                      },
                    },
                  }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                  <ChevronUp className="w-4 h-4 text-white opacity-90 group-hover:scale-110 transition-all drop-shadow" />
                </div>
              </div>

              <div
                onClick={handleExpand}
                className="min-w-0 flex-1 cursor-pointer py-0.5"
                title="Ampliar vídeo"
              >
                <h4 className="font-bold text-xs text-white truncate leading-tight">
                  {currentVideo.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {currentVideo.artist}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={handleExpand}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Ampliar"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentVideo(null);
                    setIsPlaying(false);
                    setIsMinimized(false);
                  }}
                  className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors cursor-pointer"
                  title="Cerrar vídeo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating "Ver" Button (When active video scrolls out of view) */}
        {currentVideo && !isMinimized && !isPlayerInView && (
          <button
            onClick={scrollToActiveVideo}
            className="fixed bottom-[66px] right-2 sm:right-6 sm:bottom-[30px] z-[80] bg-black/80 backdrop-blur-xl border border-white/10 hover:bg-black hover:border-red-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-full px-3 py-1.5 flex items-center gap-1.5 animate-in slide-in-from-bottom-4 fade-in duration-300 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
            <span className="text-[9px] text-white font-black uppercase tracking-[0.2em] group-hover:text-red-400 transition-colors">
              Ver
            </span>
          </button>
        )}

        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Continuar Viendo Grid View */}
          {activeCategory === "Continuar Viendo" && videoHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                      Continuar Viendo
                      <span className="text-[11px] font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        {videoHistory.length} VÍDEOS
                      </span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                      Continúa donde lo dejaste
                    </p>
                  </div>
                </div>

                <button
                  onClick={clearHistory}
                  className="px-3 py-1.5 text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold flex items-center gap-1.5 rounded-lg border border-transparent hover:border-red-500/20 cursor-pointer"
                  title="Borrar historial de vídeos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Borrar Historial</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {videoHistory.map((item) => {
                  const isThisTheActivePlayer = activePlayerContainerId === `hist-${item.id}` && !isMinimized;
                  const displayVideo = isThisTheActivePlayer && currentVideo ? currentVideo : item;

                  const savedStr = formatDurationDisplay(displayVideo.savedTime);
                  const durationDisplay = formatDurationDisplay(displayVideo.duration);
                  const classInfo = getVideoClassificationInfo(displayVideo, activeCategory);
                  const highResImg = getHighResVideoThumbnail(displayVideo.thumbnail, displayVideo.id);

                  const durationSecs = parseDurationSeconds(displayVideo.duration);
                  const progressPct =
                    durationSecs && displayVideo.savedTime
                      ? Math.min(100, Math.max(5, (displayVideo.savedTime / durationSecs) * 100))
                      : null;

                  return (
                    <div
                      key={`hist-${item.id}`}
                      id={`hist-${item.id}`}
                      onClick={(e) => {
                        const sourceId = `hist-${item.id}`;
                        if (isThisTheActivePlayer) {
                          return; // Let ReactPlayer handle clicks
                        }
                        handlePlayVideo(item, sourceId);
                      }}
                      className={`flex flex-col gap-3 group cursor-pointer transition-all duration-500 p-3 sm:p-3.5 border rounded-[20px] shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10 backdrop-blur-md ${
                        isThisTheActivePlayer ? "ring-2 ring-rose-500 bg-white/[0.08] border-rose-500/50" : ""
                      }`}
                    >
                      <div className="flex flex-col w-full bg-black rounded-xl overflow-hidden border border-white/5 shadow-md relative">
                        {isThisTheActivePlayer ? (
                          <>
                            <VideoPlayerWithControls
                              displayVideo={displayVideo}
                              isPlaying={isPlaying}
                              setIsPlaying={setIsPlaying}
                              isMuted={isMuted}
                              setIsMuted={setIsMuted}
                              volume={volume}
                              setVolume={setVolume}
                              isBabyLock={isBabyLock}
                              setIsBabyLock={setIsBabyLock}
                              played={played}
                              duration={duration}
                              onProgress={handleProgress}
                              onDuration={handleDuration}
                              onSeekMouseDown={handleSeekMouseDown}
                              onSeekChange={handleSeekChange}
                              onSeekMouseUp={handleSeekMouseUp}
                              onEnded={playNextVideo}
                              onReady={handlePlayerReady}
                              playerRef={playerRef}
                              fullscreenId={fullscreenId}
                              toggleFullscreen={toggleFullscreen}
                              showControls={showControls}
                              resetControlsTimeout={resetControlsTimeout}
                            />
                            {!isBabyLock && (
                              <ActivePlayerControlBar
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                isMuted={isMuted}
                                setIsMuted={setIsMuted}
                                volume={volume}
                                setVolume={setVolume}
                                isFullscreen={!!fullscreenId}
                                toggleFullscreen={() => toggleFullscreen(`player-card-${item.id}`)}
                                isBabyLock={isBabyLock}
                                setIsBabyLock={setIsBabyLock}
                                played={played}
                                onSeekMouseDown={handleSeekMouseDown}
                                onSeekChange={handleSeekChange}
                                onSeekMouseUp={handleSeekMouseUp}
                                duration={duration}
                                currentTime={played * duration}
                                onNext={playNextVideo}
                                isOverlay={false}
                              />
                            )}
                          </>
                        ) : (
                          <div className="relative w-full aspect-video">
                            <img
                              src={highResImg}
                              alt={displayVideo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.dataset.triedHq && displayVideo.id) {
                                  target.dataset.triedHq = "true";
                                  target.src = `https://i.ytimg.com/vi/${displayVideo.id}/hqdefault.jpg`;
                                } else if (!target.dataset.triedMq && displayVideo.id) {
                                  target.dataset.triedMq = "true";
                                  target.src = `https://i.ytimg.com/vi/${displayVideo.id}/mqdefault.jpg`;
                                } else if (!target.dataset.triedDef && displayVideo.id) {
                                  target.dataset.triedDef = "true";
                                  target.src = `https://i.ytimg.com/vi/${displayVideo.id}/default.jpg`;
                                } else {
                                  target.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                            
                            {/* Quality / Classification Top-Left Pill */}
                            <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 shadow-lg ${classInfo.badgeClass}`}>
                              {classInfo.isKids ? (
                                <ShieldCheck className="w-3 h-3 text-amber-950 fill-amber-300" />
                              ) : (
                                <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                              )}
                              <span>{classInfo.qualityBadge}</span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="w-11 h-11 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.7)] backdrop-blur-md scale-90 group-hover:scale-100 transition-all duration-300">
                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Saved Time / Duration Badge */}
                            {savedStr ? (
                              <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-red-300 border border-red-500/40 flex items-center gap-1 shadow-sm font-bold">
                                <Clock className="w-2.5 h-2.5 text-red-400" />
                                {savedStr}
                              </div>
                            ) : durationDisplay ? (
                              <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-white border border-white/20 flex items-center gap-1 shadow-md">
                                <Clock className="w-2.5 h-2.5 text-red-400" />
                                {durationDisplay}
                              </div>
                            ) : null}

                            {/* Netflix Style Watch Progress Line */}
                            {progressPct !== null && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 rounded-r-full"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 px-1">
                        <h4 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug group-hover:text-rose-400 transition-colors">
                          {displayVideo.title}
                        </h4>
                        <p className="text-xs font-semibold text-slate-400 mt-1.5 truncate flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="truncate">{displayVideo.artist}</span>
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${classInfo.tagClass}`}>
                            {classInfo.categoryTag}
                          </span>
                          {durationDisplay && (
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              • {durationDisplay}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeCategory === "Continuar Viendo" && videoHistory.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-slate-300 font-semibold text-sm flex items-center justify-center gap-2">
                <History className="w-5 h-5 text-red-500" />
                No tienes vídeos en tu historial de continuación.
              </p>
            </div>
          )}

          {/* Main Videos Grid (Recomendados / Búsqueda) */}
          {activeCategory !== "Continuar Viendo" && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-5">
                <div className="flex items-center gap-2">
                  {isKidsMode ? (
                    <div className="flex items-center gap-2">
                      <Baby className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                        {searchQuery
                          ? `Caricaturas encontradas: "${searchQuery}"`
                          : `Sección: ${activeKidsSubCategory}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                        {searchQuery
                          ? `Resultados: "${searchQuery}"`
                          : activeCategory !== "Todos"
                          ? `Vídeos de ${activeCategory}`
                          : "Vídeos Recomendados HD"}
                      </span>
                    </div>
                  )}
                </div>
                {isLoading && (
                  <div className={`flex items-center gap-2 text-xs font-semibold ${isKidsMode ? "text-amber-400" : "text-red-400"}`}>
                    <Loader2 className={`w-4 h-4 animate-spin ${isKidsMode ? "text-amber-500" : "text-red-500"}`} />
                    <span className="hidden sm:inline">{isKidsMode ? "Cargando diversión segura..." : "Cargando alta definición..."}</span>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {videos.map((video) => {
                const isThisTheActivePlayer = activePlayerContainerId === `grid-${video.id}` && !isMinimized;
                const displayVideo = isThisTheActivePlayer && currentVideo ? currentVideo : video;

                const durationDisplay = formatDurationDisplay(displayVideo.duration);
                const classInfo = getVideoClassificationInfo(displayVideo, activeCategory);
                const highResThumbnail = getHighResVideoThumbnail(displayVideo.thumbnail, displayVideo.id);

                return (
                  <div
                    key={video.id}
                    id={`grid-${video.id}`}
                    className={`flex flex-col gap-3 group cursor-pointer transition-all duration-500 p-3 sm:p-3.5 border ${
                      isKidsMode
                        ? `rounded-[28px] shadow-xl hover:shadow-2xl hover:shadow-sky-300/30 hover:-translate-y-2 bg-white/80 hover:bg-white border-white backdrop-blur-sm ${
                            currentVideo?.id === displayVideo.id
                              ? "ring-4 ring-amber-400 bg-white border-transparent"
                              : ""
                          }`
                        : `rounded-[20px] shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10 backdrop-blur-md ${
                            currentVideo?.id === displayVideo.id
                              ? "ring-2 ring-rose-500 bg-white/[0.08] border-rose-500/50"
                              : ""
                          }`
                    }`}
                    onClick={(e) => {
                      const sourceId = `grid-${video.id}`;
                      if (isThisTheActivePlayer) {
                        return; // Let ReactPlayer handle clicks
                      }
                      handlePlayVideo(video, sourceId);
                    }}
                  >
                    <div className={`flex flex-col w-full overflow-hidden shadow-md relative ${isKidsMode ? "bg-slate-100 rounded-[20px] border-2 border-slate-100/50" : "bg-black rounded-xl border border-white/5"}`}>
                      {isThisTheActivePlayer ? (
                        <>
                          <VideoPlayerWithControls
                            displayVideo={displayVideo}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            isMuted={isMuted}
                            setIsMuted={setIsMuted}
                            volume={volume}
                            setVolume={setVolume}
                            isBabyLock={isBabyLock}
                            setIsBabyLock={setIsBabyLock}
                            played={played}
                            duration={duration}
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                            onSeekMouseDown={handleSeekMouseDown}
                            onSeekChange={handleSeekChange}
                            onSeekMouseUp={handleSeekMouseUp}
                            onEnded={playNextVideo}
                            onReady={handlePlayerReady}
                            playerRef={playerRef}
                            fullscreenId={fullscreenId}
                            toggleFullscreen={toggleFullscreen}
                            showControls={showControls}
                            resetControlsTimeout={resetControlsTimeout}
                          />
                          {!isBabyLock && (
                            <ActivePlayerControlBar
                              isPlaying={isPlaying}
                              setIsPlaying={setIsPlaying}
                              isMuted={isMuted}
                              setIsMuted={setIsMuted}
                              volume={volume}
                              setVolume={setVolume}
                              isFullscreen={!!fullscreenId}
                              toggleFullscreen={() => toggleFullscreen(`player-card-${video.id}`)}
                              isBabyLock={isBabyLock}
                              setIsBabyLock={setIsBabyLock}
                              played={played}
                              onSeekMouseDown={handleSeekMouseDown}
                              onSeekChange={handleSeekChange}
                              onSeekMouseUp={handleSeekMouseUp}
                              duration={duration}
                              currentTime={played * duration}
                              onNext={playNextVideo}
                              isOverlay={false}
                            />
                          )}
                        </>
                      ) : (
                        <div className="relative w-full aspect-video">
                          <img
                            src={highResThumbnail}
                            alt={displayVideo.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.dataset.triedHq && displayVideo.id) {
                                target.dataset.triedHq = "true";
                                target.src = `https://i.ytimg.com/vi/${displayVideo.id}/hqdefault.jpg`;
                              } else if (!target.dataset.triedMq && displayVideo.id) {
                                target.dataset.triedMq = "true";
                                target.src = `https://i.ytimg.com/vi/${displayVideo.id}/mqdefault.jpg`;
                              } else if (!target.dataset.triedDef && displayVideo.id) {
                                target.dataset.triedDef = "true";
                                target.src = `https://i.ytimg.com/vi/${displayVideo.id}/default.jpg`;
                              } else {
                                target.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                          
                          {/* Quality / Classification Top-Left Pill */}
                          <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 shadow-lg ${classInfo.badgeClass}`}>
                            {classInfo.isKids ? (
                              <ShieldCheck className="w-3 h-3 text-amber-950 fill-amber-300" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                            )}
                            <span>{classInfo.qualityBadge}</span>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            {isKidsMode ? (
                              <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-90 group-hover:scale-100 transition-all duration-300">
                                <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.7)] backdrop-blur-md scale-90 group-hover:scale-100 transition-all duration-300">
                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                              </div>
                            )}
                          </div>

                          {durationDisplay ? (
                            <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-white border border-white/20 flex items-center gap-1 shadow-md z-10">
                              <Clock className={`w-2.5 h-2.5 ${isKidsMode ? "text-amber-400" : "text-red-400"}`} />
                              <span>{durationDisplay}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 px-1">
                      <h4 className={`font-bold text-sm sm:text-base line-clamp-2 leading-snug transition-colors ${isKidsMode ? "text-slate-800 group-hover:text-rose-500" : "text-white group-hover:text-rose-400"}`}>
                        {displayVideo.title}
                      </h4>
                      <p className={`text-xs font-semibold mt-1.5 truncate flex items-center gap-1.5 ${isKidsMode ? "text-slate-500" : "text-slate-400"}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isKidsMode ? "text-sky-500" : "text-rose-500"}`} />
                        <span className="truncate">{displayVideo.artist}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${classInfo.tagClass} ${isKidsMode ? "shadow-sm" : ""}`}>
                          {classInfo.categoryTag}
                        </span>
                        {durationDisplay && (
                          <span className={`text-[10px] font-mono font-bold ${isKidsMode ? "text-slate-400" : "text-slate-500"}`}>
                            • {durationDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!isLoading && videos.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-slate-300 font-semibold text-sm">
                    No se encontraron vídeos. Intenta seleccionar otra categoría o buscar otra entrevista.
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
