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
  SkipBack,
  Youtube,
  ArrowLeft,
  ArrowRight,
  Shield,
} from "lucide-react";
import ReactPlayer from "react-player";
import { useDraggable } from "../hooks/useDraggable";

const VIDEO_QUERIES = [
  "Bad Bunny entrevista completa podcast reciente 2025 2026",
  "Aitana entrevista completa podcast reciente 2025 2026",
  "Rosalía entrevista completa podcast reciente 2025 2026",
  "Rauw Alejandro entrevista completa podcast reciente",
  "Quevedo entrevista podcast completa reciente 2025 2026",
  "Karol G entrevista completa podcast reciente",
  "Bizarrap entrevista completa podcast reciente",
  "Feid entrevista completa podcast reciente",
  "La Resistencia entrevista completa viral reciente 2025 2026",
  "El Hormiguero entrevista completa viral reciente 2025 2026",
  "The Wild Project podcast completo reciente en español",
  "Nude Project podcast entrevista completa reciente",
  "podcast fitness salud nutricion entrenamiento completo en español",
  "podcast longevidad salud mental rendimiento hábitos saludables en español",
  "documental musica actualidad tendencias viral completo en español",
  "Chente Ydrach entrevista completa viral reciente"
];

const VIDEO_CATEGORIES = [
  "Todos",
  "Continuar Viendo",
  "Infantil / Kids 🎈",
  "Entrevistas",
  "Podcasts",
  "Fitness & Salud",
  "Bad Bunny",
  "Aitana",
  "Rosalía",
  "Rauw Alejandro",
  "Quevedo",
  "Karol G",
  "La Resistencia",
  "El Hormiguero",
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
  "Recomendados para niños": "la granja de zenon pocoyo bluey cocomelon mickey mouse plim plim episodios completos largos español 1 hora",
  "Dibujos": "caricaturas infantiles episodios completos dibujos animados disney junior en español bluey masha y el oso cleo y cuquin",
  "Aprender jugando": "videos educativos para niños aprender jugando numeros colores formas canciones divertidas recopilacion larga",
  "Música infantil": "canciones infantiles la granja de zenon luli pampin baby shark gallina pintadita canciones para cantar y bailar niños 1 hora",
  "Cuentos": "cuentos infantiles cortos para dormir audiocuentos con moraleja animados para niños largos completos",
  "Educación": "videos educativos niños dinosaurios ciencias planetas experimentos divertidos plaza sesamo recopilacion",
  "Aventuras": "aventuras de juguetes pocoyo la granja de pepito episodios completos videos divertidos infantiles largos"
};

const getCategoryQuery = (cat: string) => {
  switch (cat) {
    case "Todos":
      return "entrevistas virales podcasts tendencia 2025 2026 recientes producciones completas";
    case "Infantil / Kids 🎈":
    case "Infantil / Kids":
    case "Kids":
    case "Infantil":
      return "la granja de zenon pocoyo peppa pig bluey cocomelon mickey mouse plim plim episodios completos largos español 1 hora";
    case "Entrevistas":
      return "entrevistas virales completas recientes artistas famosos mas vistos 2025 2026";
    case "Podcasts":
      return "podcasts virales completos mas vistos recientes en español 2025 2026";
    case "Fitness & Salud":
      return "podcast fitness salud nutricion entrenamiento longevidad rendimiento completo en español";
    case "Bad Bunny":
      return "Bad Bunny entrevista completa reciente viral podcast 2025 2026";
    case "Aitana":
      return "Aitana entrevista completa reciente viral podcast 2025 2026";
    case "Rosalía":
      return "Rosalía entrevista completa reciente viral podcast 2025 2026";
    case "Rauw Alejandro":
      return "Rauw Alejandro entrevista completa reciente viral podcast";
    case "Quevedo":
      return "Quevedo entrevista completa reciente viral podcast 2025 2026";
    case "Karol G":
      return "Karol G entrevista completa reciente viral podcast";
    case "La Resistencia":
      return "La Resistencia entrevista completa viral reciente 2025 2026";
    case "El Hormiguero":
      return "El Hormiguero entrevista completa viral reciente 2025 2026";
    case "Urbano":
      return "entrevistas musica urbana reggaeton virales recientes completas";
    case "Curiosidades":
      return "curiosidades noticias actualidad mas virales recientes famosos documental";
    default:
      return `${cat} entrevista completa viral reciente podcast 2025 2026`;
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

  if (!isFullscreen) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-[100] transition-all duration-300 pointer-events-auto pt-10 pb-1"
      >
        <div className="flex items-center justify-between w-full px-2 sm:px-3 pb-1 gap-2">
          {/* Left Side: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="flex shrink-0 items-center justify-center text-white hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]"
            >
              {isPlaying ? (
                <Pause className="fill-current w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Play className="fill-current ml-0.5 w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            
            <div className="group/volume relative flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              {/* Volume Slider for Inline Player */}
              <div className="w-0 overflow-hidden group-hover/volume:w-16 sm:group-hover/volume:w-20 transition-all duration-300 ease-in-out flex items-center">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (newVol > 0) setIsMuted(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 sm:w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            <div className="font-mono text-[10px] sm:text-[11px] text-white/90 font-medium tracking-wide ml-1 drop-shadow-md">
              {formatTime(currentTime)} <span className="opacity-50 mx-0.5">/</span> {formatTime(duration)}
            </div>
          </div>
          
          {/* Right Side: Fullscreen */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Bottom edge progress bar */}
        <div 
          className="w-full relative h-[3px] bg-white/20 cursor-pointer group/seek hover:h-[5px] transition-all"
          onMouseDown={onSeekMouseDown}
          onTouchStart={onSeekMouseDown}
        >
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onChange={(e) => onSeekChange(parseFloat(e.target.value))}
            onMouseUp={(e) => onSeekMouseUp(parseFloat((e.target as any).value))}
            onTouchEnd={(e) => onSeekMouseUp(parseFloat((e.target as any).value))}
            className="absolute inset-0 w-full h-[15px] -top-[6px] opacity-0 z-20 cursor-pointer"
            title="Progreso del vídeo"
          />
          <div className="absolute left-0 top-0 bottom-0 bg-red-600 transition-all pointer-events-none" style={{ width: `${played * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-600 rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity transform -translate-x-1/2 shadow-[0_0_8px_rgba(220,38,38,0.9)]" style={{ left: `${played * 100}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col w-full absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[100] transition-all duration-300 pointer-events-auto pb-[max(env(safe-area-inset-bottom),24px)] pt-16 px-4 sm:px-8"
    >
      {/* LEVEL 2: Progress Bar & Timers */}
      <div className="flex flex-col w-full max-w-4xl mx-auto mb-6">
        {/* Sleek Progress Bar */}
        <div className="flex items-center w-full group/seek relative cursor-pointer mb-2.5">
          <div className="relative h-7 flex items-center w-full">
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
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              title="Progreso del vídeo"
            />
            {/* Track Background */}
            <div className="absolute left-0 right-0 bg-white/20 rounded-full pointer-events-none overflow-hidden transition-all h-1 sm:h-1.5 group-hover/seek:h-1.5 sm:group-hover/seek:h-2">
              {/* Played Track */}
              <div 
                className="h-full bg-red-600 transition-all pointer-events-none"
                style={{ width: `${played * 100}%` }}
              />
            </div>
            {/* Thumb indicator */}
            <div 
              className="absolute bg-red-600 rounded-full pointer-events-none shadow-[0_0_12px_rgba(220,38,38,0.9)] opacity-0 group-hover/seek:opacity-100 transition-opacity transform -translate-x-1/2 h-3 w-3 sm:h-4 sm:w-4"
              style={{ left: `${played * 100}%` }}
            />
          </div>
        </div>
        {/* Timers */}
        <div className="flex items-center justify-between font-medium font-mono text-white/90 select-none tracking-wide text-[13px] sm:text-sm px-1">
          <span className="drop-shadow-sm">{formatTime(currentTime)}</span>
          <span className="opacity-70 drop-shadow-sm">{formatTime(duration)}</span>
        </div>
      </div>

      {/* LEVEL 3: Main Controls Row */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto px-1 sm:px-2 gap-1 sm:gap-4">
        
        {/* Previous (10s Back) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            let newPlayed = Math.max(0, (currentTime - 10) / (duration || 1));
            onSeekChange(newPlayed);
            onSeekMouseUp(newPlayed);
          }}
          className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
          title="Retroceder 10s"
        >
          <SkipBack className="fill-current w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="flex shrink-0 items-center justify-center text-white hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/5 w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
          title={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? (
            <Pause className="fill-current w-7 h-7 sm:w-8 sm:h-8" />
          ) : (
            <Play className="fill-current ml-0.5 w-7 h-7 sm:w-8 sm:h-8" />
          )}
        </button>
        
        {/* Next */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
          title="Siguiente video"
        >
          <SkipForward className="fill-current w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Volume */}
        <div className="group/volume relative flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
            title="Volumen"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="text-red-400 w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </button>
          
          {/* Volume Slider */}
          <div className="w-0 overflow-hidden group-hover/volume:w-24 sm:group-hover/volume:w-32 transition-all duration-300 ease-in-out flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const newVol = parseFloat(e.target.value);
                setVolume(newVol);
                if (newVol > 0) setIsMuted(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-20 sm:w-28 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            />
          </div>
        </div>

        {/* Lock */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsBabyLock(true);
          }}
          className="flex shrink-0 items-center justify-center text-white/90 hover:text-red-400 hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
          title="Bloqueo Infantil"
        >
          <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-sm w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]"
          title="Salir de pantalla completa"
        >
          <Minimize className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

      </div>
    </div>
  );
};

const STATIC_YOUTUBE_CONFIG = {
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
      enablejsapi: 1,
      vq: 'hd1080',
      origin: typeof window !== "undefined" ? window.location.origin : undefined,
      widget_referrer: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  },
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
  isKidsMode = false,
}: any) => {
  const isFS = !!fullscreenId;
  const [videoReady, setVideoReady] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const playerContent = (
    <div
      id={`player-card-${displayVideo.id}`}
      className={`relative w-full transition-all duration-300 ${
        isFS 
          ? "fixed inset-0 z-[99999999999] h-[100dvh] w-screen bg-black flex items-center justify-center select-none" 
          : "aspect-video h-auto rounded-t-2xl lg:rounded-2xl bg-black"
      } group/player overflow-hidden shadow-2xl`}
      style={
        isFS 
          ? { 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              width: '100vw', 
              height: '100dvh', 
              zIndex: 99999999999, 
              WebkitTransform: 'translateZ(0)', 
              transform: 'translateZ(0)', 
              backfaceVisibility: 'hidden',
              backgroundColor: '#000000',
              touchAction: 'manipulation'
            } 
          : {}
      }
      onClick={() => {
        if (!isBabyLock) resetControlsTimeout();
      }}
      onMouseMove={() => {
        if (!isBabyLock) resetControlsTimeout();
      }}
      onTouchStart={() => {
        if (!isBabyLock) resetControlsTimeout();
      }}
    >
      {/* Background Poster Overlay - Stays until video ACTUALLY starts playing to hide YouTube's big red button */}
      {(!videoReady || !hasStartedPlaying) && (
        <div className="absolute inset-0 z-[10] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700">
          <img
            src={displayVideo.thumbnail}
            alt={displayVideo.title}
            className="w-full h-full object-cover blur-md opacity-60 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          
          {/* Custom Elegant Loading Spinner */}
          {!hasStartedPlaying && isPlaying && (
            <div className="absolute z-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-red-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Invisible Shield Overlay to completely block ALL interaction with the YouTube iframe */}
      <div className="absolute inset-0 z-[5] w-full h-full bg-transparent" />

      {/* 16:9 Video Canvas Wrapper with YouTube Crop Hack */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none bg-black">
        <div 
          className="relative w-full aspect-video flex items-center justify-center overflow-hidden max-h-full max-w-full"
          style={
            isFS 
              ? { width: '100vw', height: '56.25vw', maxHeight: '100dvh', maxWidth: '177.77dvh' } 
              : { width: '100%', height: '100%' }
          }
        >
          <div 
            className="absolute w-full pointer-events-none opacity-100"
            style={{ height: '300%', top: '-100%', left: 0 }}
          >
            <ReactPlayer
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${displayVideo.id}`}
              width="100%"
              height="100%"
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ pointerEvents: 'none' }}
              playing={isPlaying}
              volume={isMuted ? 0 : volume}
              muted={isMuted}
              onProgress={onProgress}
              onDuration={onDuration}
              onPlay={() => {
                setIsActuallyPlaying(true);
                setHasStartedPlaying(true);
              }}
              onPause={() => setIsActuallyPlaying(false)}
              onBuffer={() => setIsActuallyPlaying(false)}
              onReady={(e: any) => {
                setVideoReady(true);
                try {
                  const internalPlayer = e?.target;
                  if (internalPlayer && typeof internalPlayer.setPlaybackQuality === 'function') {
                    internalPlayer.setPlaybackQuality('hd1080');
                  }
                } catch (err) {}
                if (onReady) onReady(e);
              }}
              onEnded={onEnded}
              onError={() => {
                if (onEnded) onEnded();
              }}
              controls={false}
              playsinline={true}
              config={STATIC_YOUTUBE_CONFIG}
            />
          </div>
        </div>
      </div>

      {/* Gradient Vignette Layer (Top & Bottom) for Cinematic Depth - Only active when controls are shown */}
      <div className={`absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/95 pointer-events-none z-[6] transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-80" : "opacity-0"}`} />

      {/* Top Header Title & Back/Minimize Overlay when controls are active (Only in Fullscreen) */}
      {!isBabyLock && isFS && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 pt-3.5 bg-gradient-to-b from-black/95 via-black/50 to-transparent z-20 pointer-events-auto transition-opacity duration-300 flex items-center justify-between gap-3 ${
            showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 1rem)',
            paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
            paddingRight: 'max(env(safe-area-inset-right), 1rem)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0 max-w-[75%]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex shrink-0 items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all cursor-pointer w-9 h-9 sm:w-10 sm:h-10 border border-white/10 backdrop-blur-md"
              title="Salir de pantalla completa"
            >
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-md">
                {displayVideo.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isKidsMode ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40 backdrop-blur-md shrink-0 shadow-sm flex items-center gap-1">
                <Baby className="w-3 h-3 text-amber-400" />
                FLUX KIDS
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-white/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md shrink-0 shadow-sm">
                FLUX HD
              </span>
            )}
          </div>
        </div>
      )}

      {/* Central Play/Pause on Tap Area (Invisible) */}
      {!isBabyLock && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
            resetControlsTimeout();
          }}
          onMouseMove={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
          className={`absolute inset-0 z-10 cursor-pointer transition-all duration-300 ${
            showControls && !isPlaying ? "bg-black/30" : "bg-transparent"
          }`}
        />
      )}

      {/* Center Big Skip / Play Overlay Controls in Fullscreen */}
      {!isBabyLock && isFS && showControls && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center gap-8 sm:gap-16">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              let newPlayed = Math.max(0, ((played * duration) - 10) / (duration || 1));
              onSeekChange(newPlayed);
              onSeekMouseUp(newPlayed);
              resetControlsTimeout();
            }}
            className="pointer-events-auto flex flex-col items-center justify-center text-white/90 hover:text-white hover:bg-white/15 active:scale-95 rounded-full transition-all cursor-pointer backdrop-blur-md bg-black/40 border border-white/10 w-12 h-12 sm:w-16 sm:h-16 shadow-2xl"
            title="Retroceder 10 segundos"
          >
            <SkipBack className="fill-current w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-[8px] sm:text-[9px] font-bold mt-0.5">10s</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
              resetControlsTimeout();
            }}
            className="pointer-events-auto flex items-center justify-center text-white hover:text-white hover:scale-105 active:scale-95 rounded-full transition-all cursor-pointer backdrop-blur-md bg-red-600/90 hover:bg-red-600 border border-white/20 w-16 h-16 sm:w-20 sm:h-20 shadow-[0_0_30px_rgba(220,38,38,0.7)]"
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? (
              <Pause className="fill-current w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Play className="fill-current ml-1 w-8 h-8 sm:w-10 sm:h-10" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              let newPlayed = Math.min(0.999, ((played * duration) + 10) / (duration || 1));
              onSeekChange(newPlayed);
              onSeekMouseUp(newPlayed);
              resetControlsTimeout();
            }}
            className="pointer-events-auto flex flex-col items-center justify-center text-white/90 hover:text-white hover:bg-white/15 active:scale-95 rounded-full transition-all cursor-pointer backdrop-blur-md bg-black/40 border border-white/10 w-12 h-12 sm:w-16 sm:h-16 shadow-2xl"
            title="Adelantar 10 segundos"
          >
            <SkipForward className="fill-current w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-[8px] sm:text-[9px] font-bold mt-0.5">10s</span>
          </button>
        </div>
      )}

      {/* Control Bar Overlay (Always shown when active) */}
      {!isBabyLock && (
        <div
          onMouseMove={resetControlsTimeout}
          className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 flex flex-col justify-end ${
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

      {/* Ultra-thin ambient progress bar pinned at bottom edge when controls auto-hide */}
      {!isBabyLock && !showControls && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-10 pointer-events-none overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-200"
            style={{ width: `${played * 100}%` }}
          />
        </div>
      )}

      {isBabyLock && <BabyLockOverlay onUnlock={() => setIsBabyLock(false)} />}
    </div>
  );

  if (isFS && typeof document !== "undefined") {
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
    if (isVisible) {
      pauseBackgroundMusic();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isVisible, pauseBackgroundMusic]);

  useEffect(() => {
    if (fullscreenId) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [fullscreenId]);

  useEffect(() => {
    const handleFS = () => {
      const activeFS = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!activeFS && fullscreenId) {
        // If native fullscreen was exited on desktop/Android, sync state
        const isIos = typeof navigator !== "undefined" && (
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
        if (!isIos) {
          setFullscreenId(null);
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFS);
    document.addEventListener("webkitfullscreenchange", handleFS);
    return () => {
      document.removeEventListener("fullscreenchange", handleFS);
      document.removeEventListener("webkitfullscreenchange", handleFS);
    };
  }, [fullscreenId]);

  const toggleFullscreen = (containerId?: string) => {
    if (fullscreenId) {
      // EXIT FULLSCREEN
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setFullscreenId(null);
      if (typeof window !== "undefined" && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
        try { (window.screen as any).orientation.unlock(); } catch (e) {}
      }
    } else {
      // ENTER FULLSCREEN
      const targetId = containerId || (currentVideo ? `player-card-${currentVideo.id}` : "fullscreen-player");
      setFullscreenId(targetId);

      // Try browser Fullscreen API if supported (Android, Desktop, iPad OS 16+)
      const docEl = document.documentElement;
      const requestFS = docEl.requestFullscreen || (docEl as any).webkitRequestFullscreen || (docEl as any).msRequestFullscreen;
      if (requestFS && typeof requestFS === "function") {
        try {
          const p = requestFS.call(docEl);
          if (p && typeof p.catch === "function") {
            p.catch(() => {});
          }
        } catch (e) {}
      }

      // Try landscape lock where supported
      if (typeof window !== "undefined" && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
        try {
          (window.screen as any).orientation.lock("landscape").catch(() => {});
        } catch (e) {}
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
            titleLower.includes("no disponible") ||
            titleLower.includes("deleted video") ||
            titleLower.includes("private video")
          ) {
            return false;
          }

          // Exclude Shorts, promos, teasers, trailers, short clips
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

          if (isForKids) {
            // 1. Strict anti-adult / non-kids keywords filter (e.g. Pepas, Farruko, Bad Bunny, Reggaeton, etc.)
            const adultKeywords = [
              "pepas",
              "farruko",
              "bad bunny",
              "karol g",
              "rauw",
              "quevedo",
              "feid",
              "bizarrap",
              "bzrp",
              "ozuna",
              "daddy yankee",
              "anuel",
              "myke towers",
              "el alfa",
              "j balvin",
              "maluma",
              "duki",
              "trueno",
              "mora",
              "sech",
              "arcangel",
              "wisin",
              "yandel",
              "don omar",
              "reggaeton",
              "reggaetón",
              "reggeton",
              "perreo",
              "trap",
              "hip hop",
              "dembow",
              "corridos",
              "peso pluma",
              "desnuda",
              "sexo",
              "puta",
              "perra",
              "alcohol",
              "cerveza",
              "drogas",
              "18+",
              "explicit",
              "chente ydrach",
              "ibai",
              "wild project",
              "nude project",
              "la resistencia",
              "el hormiguero",
            ];

            if (adultKeywords.some((word) => titleLower.includes(word))) {
              return false;
            }

            // 2. Exclude standard audio markers that indicate standalone pop/urban tracks
            if (
              titleLower.includes("audio oficial") ||
              titleLower.includes("official audio") ||
              titleLower.includes("lyric video") ||
              titleLower.includes("video con letra") ||
              titleLower.includes("cover audio") ||
              titleLower.includes("visualizer") ||
              titleLower.includes("topic") ||
              titleLower.includes("full audio") ||
              titleLower.includes("sencillo")
            ) {
              return false;
            }

            // 3. Positive verification: Must contain at least one children's keyword/concept
            const kidsPositiveKeywords = [
              "granja", "zenon", "zenón", "pocoyo", "pocoyó", "peppa", "bluey", "cocomelon",
              "mickey", "disney", "baby shark", "luli pampin", "pampín", "plim plim", "bichikids",
              "cleo", "cuquin", "cuquín", "masha", "dibujos", "caricaturas", "animacion", "animación",
              "infantil", "infantiles", "niños", "niñas", "bebe", "bebé", "bebés", "bebes", "cuentos",
              "audiocuentos", "educativo", "educativos", "aprender", "colores", "numeros", "números",
              "abecedario", "reino infantil", "gallina pintadita", "pica pica", "chuchuwa", "toy cantando",
              "cantando aprendo", "plaza sesamo", "sésamo", "dinosaurios", "dinos", "juguetes", "episodio",
              "episodios", "capitulo", "capítulo", "capitulos", "temporada", "serie", "recopilacion",
              "recopilación", "maraton", "maratón", "1 hora", "canciones infantiles"
            ];

            const hasKidsKeyword = kidsPositiveKeywords.some((kw) => titleLower.includes(kw));
            if (!hasKidsKeyword) {
              return false;
            }

            // 4. Kids Mode duration filter: exclude clips under 3 minutes (180 secs)
            if (v.duration) {
              const secs = parseDurationSeconds(v.duration);
              if (secs > 0 && secs < 180) {
                return false;
              }
            }
          } else {
            // Flux Videos (non-kids): Filter out static cover songs / standalone music tracks
            const isInterviewOrPodcast =
              titleLower.includes("entrevista") ||
              titleLower.includes("podcast") ||
              titleLower.includes("documental") ||
              titleLower.includes("hablando") ||
              titleLower.includes("charla") ||
              titleLower.includes("resistencia") ||
              titleLower.includes("hormiguero") ||
              titleLower.includes("wild project") ||
              titleLower.includes("nude project") ||
              titleLower.includes("salud") ||
              titleLower.includes("fitness") ||
              titleLower.includes("nutricion") ||
              titleLower.includes("entrenamiento") ||
              titleLower.includes("rutina") ||
              titleLower.includes("actualidad") ||
              titleLower.includes("noticias");

            if (!isInterviewOrPodcast) {
              if (
                titleLower.includes("audio oficial") ||
                titleLower.includes("official audio") ||
                titleLower.includes("lyric video") ||
                titleLower.includes("video con letra") ||
                titleLower.includes("letra") ||
                titleLower.includes("audio") ||
                titleLower.includes("cover audio") ||
                titleLower.includes("visualizer") ||
                titleLower.includes("topic") ||
                titleLower.includes("full audio") ||
                titleLower.includes("sencillo")
              ) {
                return false;
              }
            }

            // Exclude short clips (< 5 mins / 300 secs) to guarantee long-form entertainment
            if (v.duration) {
              const secs = parseDurationSeconds(v.duration);
              if (secs > 0 && secs < 300) {
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
      <div 
        className="fixed inset-0 z-[999999999] h-screen w-screen bg-[#040612] text-white flex flex-col justify-between pt-[max(env(safe-area-inset-top,24px),24px)] pb-4 px-4 sm:p-10 md:p-12 overflow-y-auto font-sans selection:bg-rose-500 selection:text-white"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999999 }}
      >
        {/* Ambient Glowing Background Layers */}
        <div className="absolute top-0 left-1/4 w-[32rem] h-[32rem] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[36rem] h-[36rem] bg-rose-600/15 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none -z-10" />

        {/* Top Header with Back/Close button */}
        <div className="flex items-center justify-end w-full max-w-5xl mx-auto pt-4 sm:pt-0 z-10">
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-emerald-500/30 text-slate-200 bg-black/60 hover:bg-black/90 hover:border-red-500/60 hover:text-white transition-all duration-300 cursor-pointer shadow-xl backdrop-blur-xl group active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-emerald-400" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">Volver</span>
          </button>
        </div>

        {/* Center Prompt & Cards */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 sm:my-8 max-w-5xl mx-auto w-full z-10">
          <div className="text-center mb-6 sm:mb-12 space-y-2 max-w-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-indigo-200 tracking-tight leading-tight select-none px-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              ¿Qué deseas ver hoy?
            </h1>
            <p className="text-xs sm:text-base text-indigo-200/70 font-medium select-none max-w-md mx-auto leading-relaxed">
              Elige tu perfil de entretenimiento inmersivo exclusivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-3xl px-2 sm:px-4">
            {/* Card 1: 🎬 Flux Videos */}
            <button
              onClick={selectNormalVideosMode}
              className="group relative flex flex-col items-center justify-between text-center p-6 sm:p-10 rounded-[28px] bg-black/70 border-2 border-emerald-500/40 hover:border-red-500/70 shadow-[0_10px_35px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25),0_0_35px_rgba(239,68,68,0.35)] transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] cursor-pointer backdrop-blur-2xl overflow-hidden select-none min-h-[260px] sm:min-h-[320px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-black to-red-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4),0_0_20px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-all duration-500 mb-4 sm:mb-6 border-2 border-transparent [background:linear-gradient(#000,#000)_padding-box,linear-gradient(135deg,#10b981,#ef4444)_border-box]">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-white to-red-500">
                  Flux Videos 🎬
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/90 font-medium max-w-[280px] leading-relaxed">
                  Música, podcasts, entrevistas y contenido exclusivo en alta definición
                </p>
              </div>

              <div className="relative z-10 mt-5 sm:mt-8 px-4 py-1.5 rounded-full bg-black/80 group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-red-600 text-white text-[11px] font-black uppercase tracking-widest border border-emerald-500/30 group-hover:border-white/30 transition-all duration-300 flex items-center gap-2 shadow-md">
                <span>Entrar a Flux Videos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Card 2: 🎈 Flux Kids */}
            <button
              onClick={selectKidsMode}
              className="group relative flex flex-col items-center justify-between text-center p-6 sm:p-10 rounded-[28px] bg-slate-900/50 border border-white/10 hover:border-amber-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.25)] transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] cursor-pointer backdrop-blur-2xl overflow-hidden select-none min-h-[260px] sm:min-h-[320px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-slate-950 flex items-center justify-center shadow-[0_10px_25px_rgba(245,158,11,0.4)] group-hover:shadow-[0_15px_35px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-all duration-500 mb-4 sm:mb-6 border border-white/30">
                <Baby className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors leading-none mb-2 sm:mb-3">
                  Flux Kids 🎈
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/90 font-medium max-w-[280px] leading-relaxed">
                  Caricaturas, música, cuentos animados y aprendizaje seguro para niños
                </p>
              </div>

              <div className="relative z-10 mt-5 sm:mt-8 px-4 py-1.5 rounded-full bg-white/5 group-hover:bg-amber-500 group-hover:text-black text-white text-[11px] font-black uppercase tracking-widest border border-white/10 group-hover:border-amber-300 transition-all duration-300 flex items-center gap-2 shadow-sm">
                <span>Entrar a Flux Kids</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div className="text-center w-full max-w-5xl mx-auto py-3 z-10">
          <p className="text-[10px] sm:text-[11px] text-slate-400/80 font-extrabold tracking-[0.2em] uppercase select-none flex items-center justify-center gap-2">
            <span>Flux Music</span>
            <span className="w-1 h-1 rounded-full bg-rose-500/50" />
            <span>Streaming HD</span>
            <span className="w-1 h-1 rounded-full bg-indigo-500/50" />
            <span>Entretenimiento Exclusivo</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-[999999999] h-screen w-screen flex flex-col overflow-hidden selection:bg-red-500 selection:text-white ${isKidsMode ? "bg-gradient-to-br from-sky-200 via-teal-100 to-sky-100 text-slate-800" : "bg-[#020204] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050508] to-[#020204] text-white"}`}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999999 }}
    >
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
                <div className="flex items-center gap-2 drop-shadow-md">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black flex items-center justify-center shadow-md border-2 border-transparent [background:linear-gradient(#000,#000)_padding-box,linear-gradient(135deg,#10b981,#ef4444)_border-box] shadow-[0_0_12px_rgba(16,185,129,0.3),0_0_12px_rgba(239,68,68,0.4)]">
                    <Tv2 className="w-3.5 h-3.5 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  </div>
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase leading-none mt-0.5 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-white to-red-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    Flux Videos
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
                {/* Shield Overlay */}
                <div className="absolute inset-0 z-[5] w-full h-full bg-transparent" />
                <div 
                  className="absolute w-full pointer-events-none opacity-100"
                  style={{ height: '300%', top: '-100%', left: 0 }}
                >
                  <ReactPlayer
                    ref={playerRef}
                    url={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                    width="100%"
                    height="100%"
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ pointerEvents: 'none' }}
                    playing={isPlaying}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onReady={handlePlayerReady}
                    onEnded={playNextVideo}
                    onError={playNextVideo}
                    controls={false}
                    playsinline={true}
                    config={{
                      youtube: {
                        playerVars: {
                          autoplay: 0,
                          controls: 0,
                          modestbranding: 1,
                          rel: 0,
                          iv_load_policy: 3,
                          cc_load_policy: 0,
                          fs: 0,
                          disablekb: 1,
                          playsinline: 1,
                          enablejsapi: 1,
                          vq: 'hd720',
                          origin: typeof window !== "undefined" ? window.location.origin : undefined,
                        }
                      }
                    }}
                  />
                </div>
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

                  const isFSActiveHere = isThisTheActivePlayer && !!fullscreenId;

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
                      className={`flex flex-col gap-3 group cursor-pointer transition-all duration-500 p-3 sm:p-3.5 border rounded-[20px] shadow-lg ${
                        isFSActiveHere ? "" : "hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 backdrop-blur-md"
                      } ${
                        isThisTheActivePlayer 
                          ? "ring-1 ring-white/20 bg-gradient-to-b from-white/[0.08] to-transparent border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]" 
                          : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10"
                      }`}
                      style={
                        isFSActiveHere
                          ? {
                              transform: "none",
                              filter: "none",
                              backdropFilter: "none",
                              WebkitBackdropFilter: "none",
                              zIndex: 999999999,
                            }
                          : undefined
                      }
                    >
                      <div className={`flex flex-col w-full rounded-2xl overflow-hidden shadow-2xl relative ${isThisTheActivePlayer ? "bg-black border border-white/10" : "bg-black border border-white/5"}`}>
                        {isThisTheActivePlayer ? (
                          <>
                            {fullscreenId && (
                              <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center overflow-hidden">
                                <img
                                  src={highResImg}
                                  alt={displayVideo.title}
                                  className="w-full h-full object-cover opacity-25 blur-sm"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                                    <Maximize className="w-5 h-5" />
                                  </div>
                                  <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                    Reproduciendo en Pantalla Completa
                                  </span>
                                </div>
                              </div>
                            )}
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
                              isKidsMode={isKidsMode}
                            />
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

                const isFSActiveHere = isThisTheActivePlayer && !!fullscreenId;

                return (
                  <div
                    key={video.id}
                    id={`grid-${video.id}`}
                    className={`flex flex-col gap-3 group cursor-pointer transition-all duration-500 p-3 sm:p-3.5 border ${
                      isKidsMode
                        ? `rounded-[28px] shadow-xl ${isFSActiveHere ? "" : "hover:shadow-2xl hover:shadow-sky-300/30 hover:-translate-y-2 backdrop-blur-sm"} bg-white/80 hover:bg-white border-white ${
                            currentVideo?.id === displayVideo.id
                              ? "ring-4 ring-amber-400 bg-white border-transparent"
                              : ""
                          }`
                        : `rounded-[20px] shadow-lg ${isFSActiveHere ? "" : "hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 backdrop-blur-md"} ${
                            currentVideo?.id === displayVideo.id
                              ? "ring-1 ring-white/20 bg-gradient-to-b from-white/[0.08] to-transparent border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                              : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10"
                          }`
                    }`}
                    style={
                      isFSActiveHere
                        ? {
                            transform: "none",
                            filter: "none",
                            backdropFilter: "none",
                            WebkitBackdropFilter: "none",
                            zIndex: 999999999,
                          }
                        : undefined
                    }
                    onClick={(e) => {
                      const sourceId = `grid-${video.id}`;
                      if (isThisTheActivePlayer) {
                        return; // Let ReactPlayer handle clicks
                      }
                      handlePlayVideo(video, sourceId);
                    }}
                  >
                    <div className={`flex flex-col w-full rounded-2xl overflow-hidden shadow-2xl relative ${isKidsMode ? "bg-slate-100 border-2 border-white/40" : isThisTheActivePlayer ? "bg-black border border-white/10" : "bg-black border border-white/5"}`}>
                      {isThisTheActivePlayer ? (
                        <>
                          {fullscreenId && (
                            <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center overflow-hidden">
                              <img
                                src={highResThumbnail}
                                alt={displayVideo.title}
                                className="w-full h-full object-cover opacity-25 blur-sm"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                                <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                                  <Maximize className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                  Reproduciendo en Pantalla Completa
                                </span>
                              </div>
                            </div>
                          )}
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
                            isKidsMode={isKidsMode}
                          />
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
