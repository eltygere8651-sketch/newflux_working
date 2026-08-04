import React, { useState, useEffect, useRef } from "react";
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

const getCategoryQuery = (cat: string) => {
  switch (cat) {
    case "Todos":
      return "entrevistas virales podcasts tendencia 2025 2026 recientes";
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
  duration?: number;
  savedTime?: number;
}

const POSITIONS_KEY = "flux_video_positions";
const HISTORY_KEY = "flux_video_history";

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

export const VideoView = ({
  isVisible,
  pauseBackgroundMusic,
}: {
  isVisible: boolean;
  pauseBackgroundMusic: () => void;
}) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlayerInView, setIsPlayerInView] = useState(true);
  const [videoHistory, setVideoHistory] = useState<VideoItem[]>([]);

  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [playingId, isMinimized, currentVideo, videos, videoHistory, activeCategory]);

  useEffect(() => {
    if (!isVisible) return;
    loadHistory();
    if (videos.length === 0) {
      loadRecommendations();
    }
  }, [isVisible]);

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
    if (!video || isNaN(seconds) || seconds <= 0) return;
    try {
      const floorSecs = Math.floor(seconds);
      const positions = getSavedPositions();
      positions[video.id] = floorSecs;
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
        const filtered = data.filter(
          (v: any) =>
            !v.title.toLowerCase().includes("audio") &&
            !v.title.toLowerCase().includes("letra") &&
            !v.title.toLowerCase().includes("lyric"),
        );
        setVideos(
          filtered.map((v: any) => ({
            id: v.id,
            title: formatTitle(v.title),
            artist: v.artist || v.uploader || "YouTube",
            thumbnail: getHighResVideoThumbnail(v.thumbnail, v.id),
            duration:
              typeof v.duration === "number" && !isNaN(v.duration)
                ? v.duration
                : undefined,
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
    setActiveCategory(cat);
    if (cat === "Todos") {
      setSearchQuery("");
      await loadRecommendations();
    } else if (cat === "Continuar Viendo") {
      setSearchQuery("");
      setVideos([]); // Clear videos to just show history
    } else {
      setSearchQuery(cat);
      const catQuery = getCategoryQuery(cat);
      await fetchVideosForQuery(catQuery);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveCategory("");
    await fetchVideosForQuery(searchQuery.trim());
  };

  const playNextVideo = () => {
    if (!currentVideo) return;
    
    const activeList = activeCategory === "Continuar Viendo" ? videoHistory : videos;
    const sourcePrefix = activeCategory === "Continuar Viendo" ? "hist" : "grid";
    
    const currentIndex = activeList.findIndex(v => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < activeList.length - 1) {
      const nextVid = activeList[currentIndex + 1];
      
      const positions = getSavedPositions();
      const savedSecs = positions[nextVid.id] || nextVid.savedTime || 0;
      initialSeekTimeRef.current = savedSecs;
      
      setCurrentVideo(nextVid);
      setPlayingId(`${sourcePrefix}-${nextVid.id}`);
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
    playedSeconds: number;
    loadedSeconds: number;
  }) => {
    const secs = state.playedSeconds;
    if (currentVideo && secs > 1) {
      if (Math.abs(secs - lastSavedTimeRef.current) >= 2) {
        lastSavedTimeRef.current = secs;
        saveVideoProgress(currentVideo, secs);
      }
    }
  };

  const handlePlayerReady = () => {
    if (initialSeekTimeRef.current && initialSeekTimeRef.current > 2) {
      playerRef.current?.seekTo(initialSeekTimeRef.current, "seconds");
      initialSeekTimeRef.current = 0;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full flex flex-col bg-[#050508] text-white overflow-hidden relative z-50 selection:bg-red-500 selection:text-white">
      {/* Search & Category Filter Sticky Header */}
      <div className="shrink-0 sticky top-0 z-40 bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 p-2.5 sm:p-3.5 shadow-xl">
        <div className="flex flex-col gap-2.5 max-w-7xl mx-auto w-full">
          {/* Full Width Search Input */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Buscar vídeos, entrevistas, podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-full py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-red-500/60 focus:bg-white/10 transition-all shadow-inner placeholder:text-slate-400"
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
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 pt-0.5 touch-pan-x active:cursor-grabbing">
            {VIDEO_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border min-h-[34px] flex items-center justify-center ${
                    isSelected
                      ? "bg-white text-black border-white shadow-md shadow-white/10 scale-[1.02]"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
                  onReady={handlePlayerReady}
                  onEnded={playNextVideo}
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
                  const isThisTheActivePlayer = playingId === `hist-${item.id}` && !isMinimized;
                  const displayVideo = isThisTheActivePlayer && currentVideo ? currentVideo : item;

                  const savedStr = formatTime(displayVideo.savedTime);
                  const highResImg = getHighResVideoThumbnail(displayVideo.thumbnail, displayVideo.id);
                  const progressPct =
                    displayVideo.duration && displayVideo.savedTime
                      ? Math.min(100, Math.max(5, (displayVideo.savedTime / displayVideo.duration) * 100))
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
                      className="flex flex-col gap-2.5 group cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-slate-800/60 p-2.5 sm:p-3 rounded-2xl border border-white/10 hover:border-red-500/40 shadow-lg hover:shadow-2xl hover:-translate-y-1"
                    >
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/5 shadow-md">
                        {isThisTheActivePlayer ? (
                          <ReactPlayer
                            ref={playerRef}
                            url={`https://www.youtube.com/watch?v=${displayVideo.id}`}
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0 w-full h-full"
                            playing={isPlaying}
                            onProgress={handleProgress}
                            onReady={handlePlayerReady}
                            onEnded={playNextVideo}
                            controls={true}
                            playsinline
                            config={{
                              youtube: {
                                playerVars: {
                                  autoplay: 1,
                                  modestbranding: 1,
                                  rel: 0,
                                  iv_load_policy: 3,
                                  cc_load_policy: 0,
                                  fs: 1,
                                  playsinline: 1,
                                },
                              },
                            }}
                          />
                        ) : (
                          <>
                            <img
                              src={highResImg}
                              alt={displayVideo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${displayVideo.id}/hqdefault.jpg`;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="w-11 h-11 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.7)] backdrop-blur-md scale-90 group-hover:scale-100 transition-all duration-300">
                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                              </div>
                            </div>

                            {savedStr && (
                              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-red-300 border border-red-500/30 flex items-center gap-1 shadow-sm">
                                <Clock className="w-2.5 h-2.5 text-red-400" />
                                {savedStr}
                              </div>
                            )}

                            {/* YouTube Style Progress Line */}
                            {progressPct !== null && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 rounded-r-full"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                          {displayVideo.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1 truncate flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{displayVideo.artist}</span>
                        </p>
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
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                    {searchQuery
                      ? `Resultados: "${searchQuery}"`
                      : activeCategory !== "Todos"
                      ? `Vídeos de ${activeCategory}`
                      : "Vídeos Recomendados HD"}
                  </span>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    <span className="hidden sm:inline">Cargando alta definición...</span>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {videos.map((video) => {
                const isThisTheActivePlayer = playingId === `grid-${video.id}` && !isMinimized;
                const displayVideo = isThisTheActivePlayer && currentVideo ? currentVideo : video;

                const durationStr = formatTime(displayVideo.duration);
                const highResThumbnail = getHighResVideoThumbnail(displayVideo.thumbnail, displayVideo.id);

                return (
                  <div
                    key={video.id}
                    id={`grid-${video.id}`}
                    className={`flex flex-col gap-2.5 group cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-slate-800/60 p-2.5 sm:p-3 rounded-2xl border border-white/10 hover:border-red-500/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                      currentVideo?.id === displayVideo.id
                        ? "ring-2 ring-red-500 bg-red-500/10 border-red-500/50"
                        : ""
                    }`}
                    onClick={(e) => {
                      const sourceId = `grid-${video.id}`;
                      if (isThisTheActivePlayer) {
                        return; // Let ReactPlayer handle clicks
                      }
                      handlePlayVideo(video, sourceId);
                    }}
                  >
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/5 shadow-md">
                      {isThisTheActivePlayer ? (
                        <ReactPlayer
                          ref={playerRef}
                          url={`https://www.youtube.com/watch?v=${displayVideo.id}`}
                          width="100%"
                          height="100%"
                          className="absolute top-0 left-0 w-full h-full"
                          playing={isPlaying}
                          onProgress={handleProgress}
                          onReady={handlePlayerReady}
                          onEnded={playNextVideo}
                          controls={true}
                          playsinline
                          config={{
                            youtube: {
                              playerVars: {
                                autoplay: 1,
                                modestbranding: 1,
                                rel: 0,
                                iv_load_policy: 3,
                                cc_load_policy: 0,
                                fs: 1,
                                playsinline: 1,
                              },
                            },
                          }}
                        />
                      ) : (
                        <>
                          <img
                            src={highResThumbnail}
                            alt={displayVideo.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${displayVideo.id}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-11 h-11 bg-red-600/90 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.8)] scale-90 group-hover:scale-100 transition-all">
                              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                            </div>
                          </div>

                          {durationStr ? (
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white border border-white/10">
                              {durationStr}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                        {displayVideo.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
                        <span className="truncate">{displayVideo.artist}</span>
                      </p>
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
