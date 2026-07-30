import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Settings2, 
  Heart,
  Volume2,
  Radio,
  Music,
  Sparkles,
  X
} from "lucide-react";
import { MusicTrack } from "../types";
import { selectNextDJTrack, DJ_GENRES, isReasonableTrack, getGenreQueries } from "../lib/djLogic";

interface FAIViewProps {
  favorites: MusicTrack[];
  topTracks: MusicTrack[];
  allTracks: MusicTrack[];
  onPlayTrack: (track: MusicTrack) => void;
  onTogglePlay: () => void;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  onToggleFavorite?: (track: MusicTrack, e: React.MouseEvent) => void;
  volume?: number;
  onVolumeChange?: (val: number) => void;
  position?: number;
  duration?: number;
  triggerAiDj?: (context: string, force?: boolean) => void;
  isAdmin?: boolean;
}

const cleanTrackTitle = (title: string) => {
  return title.replace(/\[.*?\]|\(.*?\)|\- mix|mix \-|Mix|MIX|Audio Oficial|Official Video|Video Oficial|Lyric Video|Lyrics|HD|4K|1080p|Explicit/gi, "").trim();
};

const extractCleanTitle = (title: string) => {
  let cleaned = cleanTrackTitle(title);
  cleaned = cleaned.replace(/mix de\s+/gi, "");
  cleaned = cleaned.replace(/mix:\s+/gi, "");
  cleaned = cleaned.replace(/\bmix\b/gi, "");
  if (cleaned.includes(" - ")) {
    cleaned = cleaned.split(" - ").slice(1).join(" - ").trim();
  }
  return cleaned.trim() || title;
};

const extractArtist = (title: string, defaultArtist: string, d?: any) => {
  if (d && d.artist && !d.artist.includes("YouTube") && !d.artist.includes("Variado") && d.artist !== "Music") {
    return d.artist;
  }
  if (title.includes(" - ")) {
    return title.split(" - ")[0].trim();
  }
  if (d && d.channelTitle && !d.channelTitle.includes("YouTube") && !d.channelTitle.includes("Topic")) {
    return d.channelTitle.replace(" - Topic", "").trim();
  }
  const parts = title.split("-");
  if (parts.length > 1) return parts[0].trim();

  return defaultArtist === "Variado" || defaultArtist === "La mezcla de Sofia" ? extractCleanTitle(title) : defaultArtist;
};

export const FAIView: React.FC<FAIViewProps> = ({
  favorites,
  topTracks,
  allTracks,
  onPlayTrack,
  onTogglePlay,
  currentTrack,
  isPlaying,
  onToggleFavorite,
  volume = 100,
  onVolumeChange,
  position = 0,
  duration = 0,
}) => {
  const [topRatio, setTopRatio] = useState(() => {
    const saved = localStorage.getItem("fai_top_ratio");
    if (saved === "32" || saved === "40") return 60;
    return saved !== null ? parseInt(saved, 10) : 60;
  });
  const [favRatio, setFavRatio] = useState(() => {
    const saved = localStorage.getItem("fai_fav_ratio");
    if (saved === "18" || saved === "20") return 25;
    return saved !== null ? parseInt(saved, 10) : 25;
  });
  const [discRatio, setDiscRatio] = useState(() => {
    const saved = localStorage.getItem("fai_disc_ratio");
    if (saved === "50" || saved === "40") return 15;
    return saved !== null ? parseInt(saved, 10) : 15;
  });

  const [discoveryLevel, setDiscoveryLevel] = useState(() => {
    const saved = localStorage.getItem("fai_discovery_level");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [genreExploration, setGenreExploration] = useState(() => {
    const saved = localStorage.getItem("fai_genre_exploration");
    return saved === null ? true : saved === "true";
  });
  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    return localStorage.getItem("fai_selected_genre") || "La mezcla de Sofia";
  });
  const [customGenre, setCustomGenre] = useState("");

  const [showConfig, setShowConfig] = useState(false);
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [genreBuffer, setGenreBuffer] = useState<MusicTrack[]>([]);
  const [triggerPlay, setTriggerPlay] = useState(false);

  // Anti-repetition played tracks history (limit 200 items)
  const playedTrackIdsRef = useRef<Set<string>>(new Set());
  // Previous track stack for SkipBack button
  const historyStackRef = useRef<MusicTrack[]>([]);

  const isSearchingRef = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const lastPrefetchTimeRef = useRef<number>(0);
  const selectedGenreRef = useRef(selectedGenre);
  useEffect(() => {
    selectedGenreRef.current = selectedGenre;
  }, [selectedGenre]);
  const handleNextTrackRef = useRef<((isManualParam?: boolean, forceGenre?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    localStorage.setItem("fai_top_ratio", topRatio.toString());
  }, [topRatio]);

  useEffect(() => {
    localStorage.setItem("fai_fav_ratio", favRatio.toString());
  }, [favRatio]);

  useEffect(() => {
    localStorage.setItem("fai_disc_ratio", discRatio.toString());
    setDiscoveryLevel(discRatio);
  }, [discRatio]);

  useEffect(() => {
    localStorage.setItem("fai_discovery_level", discoveryLevel.toString());
  }, [discoveryLevel]);

  useEffect(() => {
    localStorage.setItem("fai_genre_exploration", genreExploration.toString());
  }, [genreExploration]);

  useEffect(() => {
    localStorage.setItem("fai_selected_genre", selectedGenre);
  }, [selectedGenre]);

  useEffect(() => {
    setGenreBuffer([]);
  }, [selectedGenre, genreExploration]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setGenreExploration(true);
    setShowConfig(false);
    setGenreBuffer([]);
    setTriggerPlay(true);
  };

  // Background prefetch function to keep buffer filled with 10-20 tracks
  const prefetchMoreTracks = useCallback(async (forceGenre?: string) => {
    if (isFetchingMoreRef.current) return;
    if (Date.now() - lastPrefetchTimeRef.current < 15000) return; // Prevent rapid prefetch loops
    isFetchingMoreRef.current = true;
    lastPrefetchTimeRef.current = Date.now();
    try {
      const activeGenre = forceGenre || selectedGenre;
      const queries = getGenreQueries(activeGenre, topTracks, favorites);
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      const resp = await fetch("/api/youtube/search?q=" + encodeURIComponent(randomQuery));
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || !Array.isArray(data) || data.length === 0) return;

      let foundTracks: MusicTrack[] = [];
      const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);

      if (playlists.length > 0) {
        for (let i = 0; i < Math.min(1, playlists.length); i++) {
          const pl = playlists[i];
          const plResp = await fetch("/api/youtube/playlist?id=" + pl.id);
          if (plResp.ok) {
            const plData = await plResp.json();
            const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
            if (tracksArray && tracksArray.length > 0) {
              const plTracks = tracksArray.map((d: any) => ({
                id: d.id,
                title: extractCleanTitle(d.title || ""),
                artist: extractArtist(d.title || "", activeGenre, d),
                bpm: d.bpm || 120,
                url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
                thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
                duration: d.duration || "N/A"
              })).filter((t: MusicTrack) => isReasonableTrack(t.duration, t.title));
              foundTracks = [...foundTracks, ...plTracks];
            }
          }
        }
      }

      if (foundTracks.length === 0) {
        const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
        if (validData.length > 0) {
          foundTracks = validData.map((d: any) => ({
            id: d.id,
            title: extractCleanTitle(d.title || ""),
            artist: extractArtist(d.title || "", activeGenre, d),
            bpm: d.bpm || 120,
            url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
            thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
            duration: d.duration || "N/A"
          }));
        }
      }

      if (foundTracks.length > 0) {
        const newTracks = foundTracks.filter(
          (t) => !playedTrackIdsRef.current.has(t.id) && t.id !== currentTrack?.id
        );

        if (newTracks.length > 0) {
          const shuffled = newTracks.sort(() => Math.random() - 0.5);
          setGenreBuffer((prev) => {
            if (activeGenre !== selectedGenreRef.current) return prev;
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueToAdd = shuffled.filter((s) => !existingIds.has(s.id));
            return [...prev, ...uniqueToAdd];
          });
        }
      }
    } catch (e) {
      console.error("FAI prefetchMoreTracks error:", e);
    } finally {
      isFetchingMoreRef.current = false;
    }
  }, [selectedGenre, topTracks, favorites, currentTrack]);

  const handleNextTrack = useCallback(async (isManualParam = false, forceGenre?: string) => {
    if (isSearchingRef.current) return;
    isSearchingRef.current = true;
    let next: MusicTrack | null = null;

    try {
      const activeGenre = forceGenre || selectedGenre;

      // Track current track in history for previous button
      if (currentTrack) {
        historyStackRef.current.push(currentTrack);
        if (historyStackRef.current.length > 25) {
          historyStackRef.current.shift();
        }
        playedTrackIdsRef.current.add(currentTrack.id);
        if (playedTrackIdsRef.current.size > 200) {
          const firstKey = playedTrackIdsRef.current.values().next().value;
          if (firstKey) playedTrackIdsRef.current.delete(firstKey);
        }
      }

      const total = topRatio + favRatio + discRatio;
      const wDisc = total > 0 ? discRatio / total : 0.15;
      const rand = Math.random();
      let doDiscovery = rand < wDisc;
      const isSpecificGenre = genreExploration && activeGenre !== "Variado Mix" && activeGenre !== "La mezcla de Sofia";

      if (!doDiscovery) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, {
          discoveryLevel,
          genreMode: isSpecificGenre,
          selectedGenre: activeGenre,
          topRatio,
          favRatio,
          discRatio: 0
        });

        // Skip if recently played
        if (next && playedTrackIdsRef.current.has(next.id)) {
          next = null;
        }

        if (!next) {
          doDiscovery = true;
        }
      }

      if (doDiscovery || !next) {
        // Pick from preloaded genreBuffer if available
        const unplayedBufferIndex = genreBuffer.findIndex(
          (t) => !playedTrackIdsRef.current.has(t.id) && t.id !== currentTrack?.id
        );

        if (unplayedBufferIndex !== -1) {
          next = genreBuffer[unplayedBufferIndex];
          setGenreBuffer((prev) => prev.filter((_, idx) => idx !== unplayedBufferIndex));
        } else {
          // Perform direct YouTube search if buffer is empty
          const queries = getGenreQueries(activeGenre, topTracks, favorites);
          const randomQuery = queries[Math.floor(Math.random() * queries.length)];

          try {
            const resp = await fetch("/api/youtube/search?q=" + encodeURIComponent(randomQuery));
            if (resp.ok) {
              const data = await resp.json();
              if (data && Array.isArray(data) && data.length > 0) {
                let foundTracks: MusicTrack[] = [];
                const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);

                if (playlists.length > 0) {
                  for (let i = 0; i < Math.min(2, playlists.length); i++) {
                    const pl = playlists[i];
                    const plResp = await fetch("/api/youtube/playlist?id=" + pl.id);
                    if (plResp.ok) {
                      const plData = await plResp.json();
                      const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                      if (tracksArray && tracksArray.length > 0) {
                        const plTracks = tracksArray.map((d: any) => ({
                          id: d.id,
                          title: extractCleanTitle(d.title || ""),
                          artist: extractArtist(d.title || "", activeGenre, d),
                          bpm: d.bpm || 120,
                          url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
                          thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
                          duration: d.duration || "N/A"
                        })).filter((t: MusicTrack) => isReasonableTrack(t.duration, t.title));
                        foundTracks = [...foundTracks, ...plTracks];
                      }
                    }
                  }
                }

                if (foundTracks.length === 0) {
                  const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                  if (validData.length > 0) {
                    foundTracks = validData.map((d: any) => ({
                      id: d.id,
                      title: extractCleanTitle(d.title || ""),
                      artist: extractArtist(d.title || "", activeGenre, d),
                      bpm: d.bpm || 120,
                      url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
                      thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
                      duration: d.duration || "N/A"
                    }));
                  }
                }

                if (foundTracks.length > 0) {
                  const unplayed = foundTracks.filter((t) => !playedTrackIdsRef.current.has(t.id) && t.id !== currentTrack?.id);
                  const pool = unplayed.length > 0 ? unplayed : foundTracks;
                  const shuffled = pool.sort(() => Math.random() - 0.5);
                  if (activeGenre === selectedGenreRef.current) {
                    next = shuffled[0];
                    setGenreBuffer(shuffled.slice(1));
                  } else {
                    next = null;
                  }
                }
              }
            }
          } catch (e) {
            console.error("FAI YouTube search failed", e);
          }
        }
      }

      if (!next) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, { 
          discoveryLevel,
          genreMode: false,
          topRatio: 33,
          favRatio: 33,
          discRatio: 33
        });
      }

      if (next) {
        playedTrackIdsRef.current.add(next.id);
        onPlayTrack(next);
        setIsRadioActive(true);

        // Trigger background prefetch if buffer is running low (< 5 items)
        if (genreBuffer.length < 5) {
          prefetchMoreTracks(activeGenre);
        }
      } else if (activeGenre !== selectedGenreRef.current) {
        setTimeout(() => setTriggerPlay(true), 50);
      }
    } catch (e) {
      console.error("FAI handleNextTrack failed", e);
    } finally {
      isSearchingRef.current = false;
    }
  }, [topTracks, favorites, allTracks, discoveryLevel, topRatio, favRatio, discRatio, genreExploration, selectedGenre, onPlayTrack, genreBuffer, currentTrack, prefetchMoreTracks]);

  const handlePrevTrack = useCallback(() => {
    if (position > 3 && currentTrack) {
      onPlayTrack(currentTrack);
      return;
    }
    if (historyStackRef.current.length > 0) {
      const prevTrack = historyStackRef.current.pop()!;
      if (currentTrack) {
        setGenreBuffer((prev) => [currentTrack, ...prev]);
      }
      onPlayTrack(prevTrack);
    } else if (currentTrack) {
      onPlayTrack(currentTrack);
    }
  }, [position, currentTrack, onPlayTrack]);

  useEffect(() => {
    const onFaiNext = () => {
      console.log("[FAI] External next track requested");
      handleNextTrack();
    };
    window.addEventListener("fai_next_track", onFaiNext);
    return () => window.removeEventListener("fai_next_track", onFaiNext);
  }, [handleNextTrack]);

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  useEffect(() => {
    if (triggerPlay) {
      setTriggerPlay(false);
      handleNextTrack();
    }
  }, [triggerPlay, handleNextTrack]);

  const handleRatioChange = (type: 'top' | 'fav' | 'disc', value: number) => {
    const target = Math.max(0, Math.min(100, value));
    
    if (type === 'top') {
      const remaining = 100 - target;
      const sumOthers = favRatio + discRatio;
      if (sumOthers > 0) {
        const newFav = Math.round(remaining * (favRatio / sumOthers));
        const newDisc = 100 - target - newFav;
        setTopRatio(target);
        setFavRatio(Math.max(0, newFav));
        setDiscRatio(Math.max(0, newDisc));
      } else {
        const newFav = Math.round(remaining / 2);
        const newDisc = 100 - target - newFav;
        setTopRatio(target);
        setFavRatio(Math.max(0, newFav));
        setDiscRatio(Math.max(0, newDisc));
      }
    } else if (type === 'fav') {
      const remaining = 100 - target;
      const sumOthers = topRatio + discRatio;
      if (sumOthers > 0) {
        const newTop = Math.round(remaining * (topRatio / sumOthers));
        const newDisc = 100 - target - newTop;
        setFavRatio(target);
        setTopRatio(Math.max(0, newTop));
        setDiscRatio(Math.max(0, newDisc));
      } else {
        const newTop = Math.round(remaining / 2);
        const newDisc = 100 - target - newTop;
        setFavRatio(target);
        setTopRatio(Math.max(0, newTop));
        setDiscRatio(Math.max(0, newDisc));
      }
    } else if (type === 'disc') {
      const remaining = 100 - target;
      const sumOthers = topRatio + favRatio;
      if (sumOthers > 0) {
        const newTop = Math.round(remaining * (topRatio / sumOthers));
        const newFav = 100 - target - newTop;
        setDiscRatio(target);
        setTopRatio(Math.max(0, newTop));
        setFavRatio(Math.max(0, newFav));
      } else {
        const newTop = Math.round(remaining / 2);
        const newFav = 100 - target - newTop;
        setDiscRatio(target);
        setTopRatio(Math.max(0, newTop));
        setFavRatio(Math.max(0, newFav));
      }
    }
  };

  const toggleRadio = () => {
    if (!isRadioActive || !currentTrack) {
      setIsRadioActive(true);
      if (!isPlaying) onTogglePlay();
      if (!currentTrack) handleNextTrack();
    } else {
      onTogglePlay();
    }
  };

  const albumArt = currentTrack?.url?.includes('youtube.com') || currentTrack?.url?.includes('youtu.be')
    ? `https://img.youtube.com/vi/${currentTrack.url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`
    : (currentTrack?.thumbnail_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop");

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onVolumeChange) return;
    const container = e.currentTarget;
    
    const updateVolume = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        onVolumeChange(Math.round(pct * 100));
      }
    };

    updateVolume(e.clientX);
    container.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        onVolumeChange(Math.round(pct * 100));
      }
    };

    const handlePointerUp = () => {
      container.releasePointerCapture(e.pointerId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
  };

  const displayPosition = position || 0;
  const displayDuration = duration || 0;
  const actualProgress = displayDuration > 0 ? (displayPosition / displayDuration) * 100 : 0;
  const showPauseIcon = isPlaying && isRadioActive;
  
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b] text-white relative overflow-hidden font-sans w-full max-w-full overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-[radial-gradient(ellipse_at_top,_rgba(192,38,211,0.12),_rgba(6,182,212,0.05),_transparent_70%)] pointer-events-none" />
      
      {/* Main Viewport */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-4 pb-4 sm:pt-6 sm:pb-6 z-10 max-w-lg mx-auto w-full overflow-y-auto overflow-x-hidden premium-scrollbar relative">
        <div className="w-full flex flex-col items-center justify-center min-h-min py-8 sm:py-12 overflow-x-hidden">
        
        {/* Top Controls / Station Selector */}
        <div className="w-full flex justify-center shrink-0 relative z-20 mb-6 px-2 mt-2">
          <button
            onClick={() => setShowConfig(true)}
            className="group relative overflow-hidden h-14 sm:h-16 px-5 sm:px-8 rounded-2xl sm:rounded-full flex items-center justify-between gap-3 transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#1a1c23]/90 to-black/80 backdrop-blur-md border border-white/10 hover:border-[#17d1a5]/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(23,209,165,0.2)] w-full max-w-md mx-auto"
            title="Elige tu música"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-[#17d1a5]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 group-hover:border-[#17d1a5]/50 transition-all shadow-inner shrink-0">
                {genreExploration ? (
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-hover:text-[#17d1a5] transition-colors" />
                ) : (
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-hover:text-[#17d1a5] transition-colors" />
                )}
              </div>
              
              <div className="flex flex-col items-start text-left truncate">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#17d1a5] drop-shadow-[0_0_8px_rgba(23,209,165,0.5)] mb-0.5">
                  {genreExploration ? "Escuchando" : "Mezcla Algorítmica"}
                </span>
                <span className="text-sm sm:text-lg font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-[#17d1a5] group-hover:to-cyan-300 transition-all truncate w-full">
                  {genreExploration ? selectedGenre : "Mix Inteligente FLX"}
                </span>
              </div>
            </div>

            <div className="relative z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#17d1a5]/10 group-hover:border-[#17d1a5]/30 transition-all shrink-0">
              <Settings2 className="w-4 h-4 text-white/50 group-hover:text-[#17d1a5]" />
            </div>
          </button>
        </div>

        {/* Album Art Card */}
        <div className="w-full flex justify-center items-center shrink-0 mb-4 sm:mb-8 px-2 relative">
          <motion.div 
            className="relative w-[180px] sm:w-[240px] shrink-0 aspect-square group z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(217,70,239,0.15)_0%,_transparent_70%)] rounded-[2rem] pointer-events-none" />
            <div className="relative w-full h-full group">
              <motion.img
                key={currentTrack?.id || "empty"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={albumArt}
                className="w-full h-full object-cover rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl border border-[#17d1a5]/20 relative z-10"
                alt="Now Playing"
              />
              <div className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] bg-gradient-to-t from-[#070b1a]/90 via-[#070b1a]/20 to-transparent z-10 pointer-events-none" />
            </div>
          </motion.div>
        </div>

        <div className="w-full flex flex-col shrink-0">
          {/* Track Metadata Section */}
          <div className="w-full mb-6 sm:mb-8 mt-2 flex flex-col items-center">
            <div className="flex flex-col items-center justify-center relative w-full overflow-hidden">
              <motion.h2 
                key={(currentTrack?.title) + "-title"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white truncate px-4 text-center w-full drop-shadow-md"
              >
                {currentTrack?.title || "Cargando..."}
              </motion.h2>
              <motion.p
                key={(currentTrack?.artist) + "-artist"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-emerald-400 mt-1.5 sm:mt-2 truncate px-4 text-center w-full"
              >
                {currentTrack?.artist || "RADIO FLUX MUSIC"}
              </motion.p>
            </div>
          </div>

          {/* Progress Bar & Time */}
          <div className="w-full mb-6 sm:mb-8">
            <div className="relative h-1 bg-white/10 rounded-full mb-2.5">
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${actualProgress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full shadow-[0_0_15px_white] z-20"
                style={{ left: `${actualProgress}%`, marginLeft: '-5px' }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] sm:text-xs sm:text-lg sm:text-xl font-black tracking-[0.15em] text-white/30">
              <span>{formatTime(displayPosition)} / {formatTime(displayDuration)}</span>
            </div>
          </div>

          {/* Main Playback Controls */}
          <div className="flex items-center justify-between w-full px-4 sm:px-8 max-w-lg mb-8 sm:mb-12 mt-auto pb-4">
            {/* Favorite button on the left */}
            <div className="flex justify-start items-center gap-1 sm:gap-3 w-full pl-1 sm:pl-2">
              <button 
                onClick={(e) => {
                  if (currentTrack && onToggleFavorite) {
                    onToggleFavorite(currentTrack, e);
                  }
                }}
                className={`p-1 sm:p-2 transition-all transform active:scale-90 flex-shrink-0 ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'text-[#1ED760] hover:text-[#17b54e]' : 'text-white/40 hover:text-white'}`}
                title="Favorito"
              >
                <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center Play Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 flex-shrink-0 min-w-max mx-2 sm:mx-0">
              <button 
                onClick={handlePrevTrack}
                className="p-1 sm:p-2 text-white/80 hover:text-white transition-all transform active:scale-90 flex-shrink-0"
                title="Anterior"
              >
                <SkipBack className="fill-current w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={toggleRadio}
                className="rounded-full w-12 h-12 sm:w-16 sm:h-16 bg-white text-black flex items-center justify-center transition-all duration-350 shadow-xl flex-shrink-0"
                title={showPauseIcon ? "Pausar" : "Reproducir"}
              >
                {showPauseIcon ? <Pause className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7" /> : <Play className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7 ml-0.5 sm:ml-1" />}
              </motion.button>
              
              <button 
                onClick={() => handleNextTrack(true)}
                className="p-1 sm:p-2 text-white hover:text-emerald-400 transition-all transform active:scale-90 flex-shrink-0"
                title="Siguiente"
              >
                <SkipForward className="fill-current w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            {/* Volume Adjuster */}
            <div className="flex justify-end items-center gap-1.5 sm:gap-3 w-full pr-1 sm:pr-2">
              <div className="flex items-center justify-end gap-1 sm:gap-1.5 group/vol w-[65px] sm:w-[100px]">
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover/vol:text-white transition-colors shrink-0" />
                <div
                  onPointerDown={handleVolumePointerDown}
                  className="w-full h-1 bg-white/20 rounded-full relative cursor-pointer group-hover/vol:h-1.5 transition-all touch-none flex items-center"
                >
                  <div
                    className="absolute left-0 h-full rounded-full bg-slate-300 group-hover/vol:bg-white pointer-events-none transition-colors"
                    style={{ width: `${volume}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow opacity-100 transition-opacity translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col justify-center items-center"
              onClick={() => setShowConfig(false)}
            >
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-[100dvh] max-w-4xl bg-gradient-to-b from-[#0a1128] to-[#070b1a] rounded-none pt-16 sm:pt-12 pb-12 px-6 sm:px-12 flex flex-col gap-6 sm:gap-8 overflow-hidden relative shadow-2xl border-x border-white/5"
              >              
              <div className="flex items-center justify-center relative sm:mt-2 mb-2 shrink-0">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Configuración FLX Radio</h3>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="absolute right-0 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
              </div>

              {/* Mode Toggle inside Config */}
              <div className="bg-black/40 border border-white/10 p-1.5 rounded-2xl flex items-center relative w-full mb-1 shrink-0">
                <button 
                   onClick={() => {
                     setGenreExploration(true);
                   }}
                   className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all z-10 flex items-center justify-center gap-2 ${genreExploration ? "text-black bg-[#17d1a5] shadow-[0_0_20px_rgba(23,209,165,0.4)]" : "text-white/50 hover:text-white"}`}
                >
                  <Music className="w-6 h-6 sm:w-8 sm:h-8" />
                  GÉNEROS
                </button>
                <button 
                  onClick={() => {
                     if (genreExploration) {
                        setGenreExploration(false);
                        setTriggerPlay(true);
                     }
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all z-10 flex items-center justify-center gap-2 ${!genreExploration ? "text-black bg-[#17d1a5] shadow-[0_0_20px_rgba(23,209,165,0.4)]" : "text-white/50 hover:text-white"}`}
                >
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                  ALGORITMO
                </button>
              </div>

              {/* Configuration Panel Content */}
              <div className="bg-[#1a1c23]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-y-auto premium-scrollbar shadow-inner flex-1 min-h-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_rgba(59,130,246,0.2)_0%,_transparent_70%)] pointer-events-none" />
                 
                 {!genreExploration ? (
                   <>
                     <div className="flex items-center justify-between z-10 mb-2 shrink-0">
                        <div>
                          <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                             <Settings2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />
                             Ajuste de Mezcla FLX
                          </h4>
                          <p className="text-sm sm:text-base text-white/50 mt-1.5">Configura el balance del algoritmo inteligente.</p>
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-5 z-10 mt-2">
                       {/* Top Canciones Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Top canciones</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{topRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={topRatio}
                             onChange={(e) => handleRatioChange('top', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>

                       {/* Canciones Favoritas Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Canciones favoritas</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{favRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={favRatio}
                             onChange={(e) => handleRatioChange('fav', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>

                       {/* Descubrimiento Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Descubrimiento nuevo</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{discRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={discRatio}
                             onChange={(e) => handleRatioChange('disc', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-[#243c94]/40 border border-[#243c94]/60 rounded-xl p-4 flex flex-col gap-3 shadow-inner z-10 shrink-0 mt-auto">
                       <h4 className="text-sm sm:text-base font-bold text-white mb-1 uppercase tracking-wider">Distribución de bloques:</h4>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Top canciones:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{topRatio}%</span></p>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Canciones favoritas:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{favRatio}%</span></p>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Descubrimiento nuevo:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{discRatio}%</span></p>
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col gap-2 z-10 flex-1">
                     <div className="flex flex-col gap-2 shrink-0 mb-2">
                       <input
                         type="text"
                         placeholder="Ej: Synthwave, K-Pop..."
                         value={customGenre}
                         onChange={(e) => setCustomGenre(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === "Enter" && customGenre.trim()) {
                             handleGenreSelect(customGenre.trim());
                             setCustomGenre("");
                             setShowConfig(false);
                           }
                         }}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#17d1a5] focus:ring-1 focus:ring-[#17d1a5] transition-all font-medium shadow-inner"
                       />
                       {customGenre.trim() && (
                         <button 
                           onClick={() => {
                             handleGenreSelect(customGenre.trim());
                             setCustomGenre("");
                             setShowConfig(false);
                           }}
                           className="w-full py-3 bg-[#17d1a5] hover:bg-[#14b892] text-black font-black uppercase text-sm sm:text-base tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(23,209,165,0.3)]"
                         >
                           Reproducir: {customGenre.trim()}
                         </button>
                       )}
                     </div>
                     <div className="flex-1 flex flex-col gap-2 pb-4">
                       {DJ_GENRES.map((genre) => (
                         <button
                           key={genre}
                           onClick={() => {
                             handleGenreSelect(genre);
                             setShowConfig(false);
                           }}
                           className={`p-4 rounded-xl flex items-center justify-between transition-all shrink-0 border ${
                             genreExploration && selectedGenre === genre
                               ? "bg-[#17d1a5]/10 border-[#17d1a5]/50 text-[#17d1a5]"
                               : "bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white"
                           }`}
                         >
                           <span className="font-bold text-[13px] tracking-wide">{genre}</span>
                           {genreExploration && selectedGenre === genre && <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
