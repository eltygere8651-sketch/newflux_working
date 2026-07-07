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
  Plus,
  Share2,
  Volume2,
  RotateCcw,
  Radio,
  Users,
  Music,
  Tv,
  Sparkles,
  MoreHorizontal,
  X,
  Compass,
  ChevronRight
} from "lucide-react";
import { MusicTrack } from "../types";
import { selectNextDJTrack, FLUX_PAYOLA, DJ_GENRES, isReasonableTrack } from "../lib/djLogic";

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
}

const cleanTrackTitle = (title: string) => {
  return title.replace(/\[.*?\]|\(.*?\)|\- mix|mix \-|Mix|MIX|Audio Oficial|Official Video|Video Oficial|Lyric Video|Lyrics/gi, "").trim();
};

const extractArtist = (title: string, defaultArtist: string) => {
  if (title.includes(" - ")) {
    return title.split(" - ")[0].trim();
  }
  return defaultArtist;
};

const extractCleanTitle = (title: string) => {
  let cleaned = cleanTrackTitle(title);
  
  // Remove "Mix" words so the user just sees the song/artist, preventing "Mix de Fulano"
  cleaned = cleaned.replace(/mix de\s+/gi, "");
  cleaned = cleaned.replace(/mix:\s+/gi, "");
  cleaned = cleaned.replace(/\bmix\b/gi, "");
  
  if (cleaned.includes(" - ")) {
    cleaned = cleaned.split(" - ").slice(1).join(" - ").trim();
  }
  return cleaned.trim() || title;
};

const cachedWelcomeText = "¡Qué pasa chavales! 🔥 Aquí Sofía DJ al mando de los platos. Os traigo un set que es puro fuego, ¡así que subid el volumen al máximo y que empiece el desmadre! ⚡️";


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
  triggerAiDj,
}) => {
  const [topRatio, setTopRatio] = useState(() => {
    const saved = localStorage.getItem("fai_top_ratio");
    return saved !== null ? parseInt(saved, 10) : 30;
  });
  const [favRatio, setFavRatio] = useState(() => {
    const saved = localStorage.getItem("fai_fav_ratio");
    return saved !== null ? parseInt(saved, 10) : 20;
  });
  const [discRatio, setDiscRatio] = useState(() => {
    const saved = localStorage.getItem("fai_disc_ratio");
    return saved !== null ? parseInt(saved, 10) : 50;
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
    return localStorage.getItem("fai_selected_genre") || "SOFIA_DJ MEZCLA";
  });
  const [customGenre, setCustomGenre] = useState("");

  const [djMessage, setDjMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [genreBuffer, setGenreBuffer] = useState<MusicTrack[]>([]);
  const [triggerPlay, setTriggerPlay] = useState(false);

  // Auto-start welcome on mount if not yet played in session - DISABLED as per user request to play only on Play click
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!welcomePlayed && !isRadioActive) {
        handleStartWelcome();
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [welcomePlayed, isRadioActive]);
  */
  const [welcomePlayed, setWelcomePlayed] = useState(false);

  const [welcomeStep, setWelcomeStep] = useState<"idle" | "loading" | "speaking">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const [welcomePosition, setWelcomePosition] = useState(0);
  const [welcomeDuration, setWelcomeDuration] = useState(0);
  const [welcomeText, setWelcomeText] = useState(cachedWelcomeText);

  const isSpeakingRef = useRef(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextTrackRef = useRef<((isManualParam?: boolean) => Promise<void>) | null>(null);
  const handleEndWelcomeRef = useRef<(() => void) | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const welcomeRequestIdRef = useRef<number>(0);

  const setSpeaking = (val: boolean) => {
    setIsSpeaking(val);
    isSpeakingRef.current = val;
  };

  useEffect(() => {
    return () => {
      welcomeRequestIdRef.current++;
      if (welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        welcomeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const showDJMessage = useCallback((message: string) => {
    // Visual message display is disabled to optimize resources as requested by the user.
  }, []);

  useEffect(() => {
    const handleDjMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showDJMessage(customEvent.detail);
      }
    };
    window.addEventListener("dj_message_received", handleDjMessage);
    return () => {
      window.removeEventListener("dj_message_received", handleDjMessage);
    };
  }, [showDJMessage]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setGenreExploration(true);
    setShowGenres(false);
    setGenreBuffer([]);
    setTriggerPlay(true);
  };

  const handleNextTrack = useCallback(async (isManualParam = false) => {
    if (isSpeakingRef.current) {
      handleEndWelcomeRef.current?.();
      return;
    }
    const isManual = isManualParam === true;
    let next: MusicTrack | null = null;

    if (genreExploration && selectedGenre !== "Variado Mix" && selectedGenre !== "SOFIA_DJ MEZCLA") {
      if (genreBuffer.length > 0) {
        next = genreBuffer[0];
        setGenreBuffer(prev => prev.slice(1));
      } else {
        // Fetch new buffer from YouTube Search for the genre to ensure real variety
        try {
          const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(selectedGenre + " playlist")}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const playlists = data.filter((d: any) => d.isPlaylist);
              let foundTracks: MusicTrack[] = [];
              
              if (playlists.length > 0) {
                // Try up to 2 playlists to find tracks
                for (let i = 0; i < Math.min(2, playlists.length); i++) {
                  const pl = playlists[i];
                  const plResp = await fetch(`/api/youtube/playlist?id=${pl.id}`);
                  if (plResp.ok) {
                    const plData = await plResp.json();
                    const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                    if (tracksArray && tracksArray.length > 0) {
                      foundTracks = tracksArray.map((d: any) => ({
                        id: d.id,
                        title: extractCleanTitle(d.title),
                        artist: extractArtist(d.title, selectedGenre),
                        url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                        thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                        duration: d.duration || "N/A"
                      })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                      if (foundTracks.length > 0) break;
                    }
                  }
                }
              }

              if (foundTracks.length === 0) {
                // fallback to videos
                const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                if (validData.length > 0) {
                   foundTracks = validData.map((d: any) => ({
                    id: d.id,
                    title: extractCleanTitle(d.title),
                    artist: extractArtist(d.title, selectedGenre),
                    url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                    thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                    duration: d.duration || "N/A"
                  }));
                }
              }

              if (foundTracks.length > 0) {
                const shuffled = foundTracks.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
      }
    } else if (selectedGenre === "Variado Mix" || selectedGenre === "SOFIA_DJ MEZCLA") {
      if (genreBuffer.length > 0) {
          next = genreBuffer[0];
          setGenreBuffer(prev => prev.slice(1));
        } else {
          // Fetch new buffer from YouTube Search for trendy, non-repetitive variety focusing on top young hits
          const TOP_HITS_QUERIES = [
            "reggaeton actual 2024 exitos audio oficial",
            "top canciones españa tendencia hoy hits official music video",
            "house super top 2024 ibiza club hits audio",
            "musica urbana españa 2024 official audio",
            "exitos reggaeton nuevo 2024 bizarrap quevedo rauw official video",
            "deep house vocal mix 2024 official music video",
            "techno house super top 2024 tomorrowland sets official",
            "los 40 principales españa 2024 hoy official audio"
          ];
          // Select a random query from the pool to avoid repeating the same lists!
          const randomQuery = TOP_HITS_QUERIES[Math.floor(Math.random() * TOP_HITS_QUERIES.length)];
          try {
            const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(randomQuery)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const playlists = data.filter((d: any) => d.isPlaylist);
              let foundTracks: MusicTrack[] = [];

              if (playlists.length > 0) {
                // Try up to 3 playlists to merge tracks and get huge variety
                for (let i = 0; i < Math.min(3, playlists.length); i++) {
                  const pl = playlists[i];
                  const plResp = await fetch(`/api/youtube/playlist?id=${pl.id}`);
                  if (plResp.ok) {
                    const plData = await plResp.json();
                    const tracksArray2 = Array.isArray(plData) ? plData : (plData.tracks || []);
                    if (tracksArray2 && tracksArray2.length > 0) {
                      const plTracks = tracksArray2.map((d: any) => ({
                        id: d.id,
                        title: extractCleanTitle(d.title),
                        artist: extractArtist(d.title, "Variado"),
                        url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                        thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                        duration: d.duration || "N/A"
                      })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                      foundTracks = [...foundTracks, ...plTracks];
                    }
                  }
                }
              }

              if (foundTracks.length === 0) {
                // Fallback to videos
                const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                if (validData.length > 0) {
                  foundTracks = validData.map((d: any) => ({
                    id: d.id,
                    title: extractCleanTitle(d.title),
                    artist: extractArtist(d.title, "Variado"),
                    url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                    thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                    duration: d.duration || "N/A"
                  }));
                }
              }

              if (foundTracks.length > 0) {
                const shuffled = foundTracks.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch (e) {
          console.error("FAI Varied Mix search failed", e);
        }
      }
    }

    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false, // Managed externally now if active
        topRatio,
        favRatio,
        discRatio
      });
    }
    
    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
    }
  }, [topTracks, favorites, allTracks, discoveryLevel, topRatio, favRatio, discRatio, genreExploration, selectedGenre, onPlayTrack, showDJMessage, genreBuffer, triggerAiDj]);

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  useEffect(() => {
    if (triggerPlay) {
      setTriggerPlay(false);
      handleNextTrack();
    }
  }, [triggerPlay, handleNextTrack]);



  const handleEndWelcome = () => {
    const elapsed = Date.now() - speechStartTimeRef.current;
    
    setSpeaking(false);
    setIsSpeakingPaused(false);
    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.pause();
      welcomeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // If the welcome ended or errored in less than 500ms, it was blocked or errored out instantly.
    // In that case, DO NOT auto-start the background music! Stay in idle state so the user can click play to sintonize/listen.
    if (elapsed < 500) {
      console.warn("Welcome speaking failed or was blocked instantly (elapsed:", elapsed, "ms). Keeping in idle state.");
      setWelcomePlayed(false);
      setIsRadioActive(false);
      return;
    }

    setWelcomePlayed(true);
    sessionStorage.setItem("flux_radio_welcome_played_session", "true");
    
    // Auto start the radio playback correctly!
    // We always trigger a new track selection from the DJ logic after the intro
    // to ensure the user enters the "Radio" experience even if they had a previous track.
    handleNextTrackRef.current?.(false);
    setIsRadioActive(true);
  };

  useEffect(() => {
    handleEndWelcomeRef.current = handleEndWelcome;
  }, [currentTrack, isPlaying, onTogglePlay]);

  const handleStartWelcome = async () => {
    const myRequestId = ++welcomeRequestIdRef.current;
    speechStartTimeRef.current = Date.now();
    setWelcomeStep("speaking");
    setSpeaking(true);
    setIsSpeakingPaused(false);
    setIsRadioActive(true);
    setWelcomePosition(0);
    setWelcomeDuration(0);

    // Pause any background music currently playing
    if (isPlaying) {
      onTogglePlay();
    }

    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.pause();
      welcomeAudioRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Unlock SpeechSynthesis context for subsequent asynchronous triggers
      try {
        const unlockUtterance = new SpeechSynthesisUtterance(" ");
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);
      } catch (err) {}
    }

    try {
      const headers: Record<string, string> = {};
      const localApiKey = localStorage.getItem("fai_elevenlabs_api_key") || "";
      const localVoiceId = localStorage.getItem("fai_elevenlabs_voice_id") || "";
      if (localApiKey.trim()) {
        headers["x-elevenlabs-api-key"] = localApiKey.trim();
      }
      if (localVoiceId.trim()) {
        headers["x-elevenlabs-voice-id"] = localVoiceId.trim();
      }

      const res = await fetch("/api/radio/welcome", { headers });
      if (myRequestId !== welcomeRequestIdRef.current) {
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (myRequestId !== welcomeRequestIdRef.current) {
          return;
        }
        let currentText = welcomeText;
        if (data.text) {
          setWelcomeText(data.text);
          currentText = data.text;
        }
        if (data.audio) {
          const audioSrc = data.audio.startsWith("data:")
            ? data.audio
            : ("data:audio/wav;base64," + data.audio);
          const audio = new Audio(audioSrc);
          
          if (myRequestId !== welcomeRequestIdRef.current) {
            return;
          }
          welcomeAudioRef.current = audio;
          audio.volume = volume / 100;
          audio.onloadedmetadata = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              setWelcomeDuration(audio.duration || 0);
            }
          };
          audio.ontimeupdate = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              setWelcomePosition(audio.currentTime || 0);
            }
          };
          audio.onended = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              handleEndWelcome();
            }
          };
          audio.onerror = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              speakFallback(currentText, myRequestId);
            }
          };
          audio.play().catch((e) => {
            console.error("Audio playback error, falling back", e);
            if (myRequestId === welcomeRequestIdRef.current) {
              speakFallback(currentText, myRequestId);
            }
          });
        } else {
          speakFallback(currentText, myRequestId);
        }
      } else {
        speakFallback(undefined, myRequestId);
      }
    } catch (e) {
      console.error("Welcome request failed, falling back", e);
      if (myRequestId === welcomeRequestIdRef.current) {
        speakFallback(undefined, myRequestId);
      }
    }
  };

  /* Auto-start removed */
  
  useEffect(() => {
    // ACTIVE PLAYER LOCK: If Sofía is currently speaking, the background music MUST be paused.
    // This resolves any race conditions where a track starts playing before Sofía finishes her intro.
    if (isSpeaking && isPlaying) {
      console.log("[Sync] Sofía is speaking. Pausing background music.");
      onTogglePlay();
    }
  }, [isSpeaking, isPlaying, onTogglePlay]);

  const speakFallback = (overrideText?: string, reqId?: number) => {
    if (reqId !== undefined && reqId !== welcomeRequestIdRef.current) {
      return;
    }
    speechStartTimeRef.current = Date.now();
    setWelcomeStep("speaking");
    setSpeaking(true);
    setIsSpeakingPaused(false);
    const textToSpeak = overrideText || welcomeText;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const playUtterance = () => {
        if (reqId !== undefined && reqId !== welcomeRequestIdRef.current) {
          return;
        }
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "es-ES";
        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter(v => v.lang.startsWith("es") || v.lang.startsWith("ES"));
        
        let femaleVoice = spanishVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes("helena") || name.includes("monica") || name.includes("paulina") || name.includes("sonia") || name.includes("alba") || name.includes("google") || name.includes("natural") || name.includes("female") || name.includes("sofia");
        });
        
        if (!femaleVoice) {
          femaleVoice = spanishVoices.find(v => v.lang.startsWith("es")) || voices[0];
        }
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        utterance.rate = 1.3; // Fast and energetic!
        utterance.pitch = 1.15; // Bright and youthful!
        utterance.onend = () => {
          if (reqId === undefined || reqId === welcomeRequestIdRef.current) {
            handleEndWelcome();
          }
        };
        utterance.onerror = () => {
          if (reqId === undefined || reqId === welcomeRequestIdRef.current) {
            handleEndWelcome();
          }
        };
        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        playUtterance();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          playUtterance();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(() => {
          if (window.speechSynthesis.onvoiceschanged) {
            playUtterance();
            window.speechSynthesis.onvoiceschanged = null;
          }
        }, 150);
      }
    } else {
      setTimeout(() => {
        if (reqId === undefined || reqId === welcomeRequestIdRef.current) {
          handleEndWelcome();
        }
      }, 10000);
    }
  };

  // Keep welcome audio volume in sync
  useEffect(() => {
    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.volume = volume / 100;
    }
  }, [volume]);

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
    if (!isRadioActive) {
      // Start radio session
      if (!welcomePlayed) {
        handleStartWelcome();
      } else {
        setIsRadioActive(true);
        if (!isPlaying) onTogglePlay();
        if (!currentTrack) handleNextTrack();
      }
    } else {
      // Radio already active
      if (isSpeaking) {
        if (welcomeAudioRef.current) {
          if (welcomeAudioRef.current.paused) {
            welcomeAudioRef.current.play().catch(e => console.error("Audio resume error", e));
            setIsSpeakingPaused(false);
          } else {
            welcomeAudioRef.current.pause();
            setIsSpeakingPaused(true);
          }
        } else {
          // fallback tts pause/resume
          if (isSpeakingPaused) {
            window.speechSynthesis.resume();
            setIsSpeakingPaused(false);
          } else {
            window.speechSynthesis.pause();
            setIsSpeakingPaused(true);
          }
        }
      } else {
        onTogglePlay();
      }
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

  const displayPosition = isSpeaking ? welcomePosition : (position || 0);
  const displayDuration = isSpeaking ? welcomeDuration : (duration || 0);
  const actualProgress = displayDuration > 0 ? (displayPosition / displayDuration) * 100 : 0;
  const showPauseIcon = isSpeaking ? !isSpeakingPaused : (isPlaying && isRadioActive);
  
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b] text-white relative overflow-hidden font-sans w-full max-w-full overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Main Viewport */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-4 pb-4 sm:pt-6 sm:pb-6 z-10 max-w-lg mx-auto w-full overflow-y-auto overflow-x-hidden premium-scrollbar relative">
        <div className="w-full flex flex-col items-center justify-center min-h-min py-8 sm:py-12 overflow-x-hidden">
        {/* Mode Selector Pill */}
        <div className="w-full flex justify-center mb-4 sm:mb-8 shrink-0 relative z-20 mt-2 sm:mt-0">
          <button
            onClick={() => setShowConfig(true)}
            className="group relative flex items-center gap-2.5 bg-[#1a1c23] hover:bg-[#242730] border border-white/10 rounded-full py-2 px-5 transition-all shadow-xl hover:shadow-[#17d1a5]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#17d1a5]/10 to-blue-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            {!genreExploration ? (
              <>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />
                <span className="text-sm sm:text-base font-black text-white tracking-widest uppercase mt-[1px]">Modo Algoritmo</span>
              </>
            ) : (
              <>
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                <span className="text-sm sm:text-base font-black text-white tracking-widest uppercase mt-[1px] truncate max-w-[150px]">{selectedGenre}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        <div className="w-full flex justify-center items-center shrink-0 mb-4 sm:mb-8 px-2 relative mt-2 sm:mt-0">
          
          {/* Album Art Card */}
          <motion.div 
            className="relative w-[180px] sm:w-[240px] shrink-0 aspect-square group z-10"
          >
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-[2rem] opacity-50 pointer-events-none" />
          
          {isSpeaking ? (
            <div className="w-full h-full rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#11131a] border border-white/10 relative z-10 flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#17d1a5] to-blue-500 opacity-20 blur-xl pointer-events-none"
                  animate={{ scale: isSpeakingPaused ? 1 : [1, 1.25, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className={`absolute inset-2 rounded-full border border-[#17d1a5]/30 ${isSpeakingPaused ? "" : "animate-ping opacity-30 pointer-events-none"}`} />
                <div className="absolute inset-4 rounded-full bg-slate-950 border border-[#17d1a5]/20 overflow-hidden flex items-center justify-center">
                  <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />
                </div>
              </div>

              <span className="text-[10px] font-black text-[#17d1a5] tracking-widest uppercase mb-1 text-center select-none">
                Sofía en el aire 🎙️
              </span>

              {/* Dynamic Equalizer Visualizer */}
              <div className="flex items-end justify-center gap-1 h-6 my-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1 bg-[#17d1a5] rounded-full"
                    animate={{
                      height: (isSpeaking && !isSpeakingPaused) ? ["20%", "100%", "20%"] : "15%"
                    }}
                    transition={{
                      duration: 0.4 + bar * 0.05,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <motion.img
              key={currentTrack?.id || "empty"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={albumArt}
              className="w-full h-full object-cover rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl border border-white/10 relative z-10"
              alt="Now Playing"
            />
          )}
          </motion.div>
        </div>

        <div className="w-full flex flex-col shrink-0">
        {/* Track Metadata Section */}
        <div className="w-full mb-4 sm:mb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 text-left">
              <motion.h2 
                key={isSpeaking ? "welcome" : currentTrack?.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg sm:text-xl font-black tracking-tight truncate mb-0.5 leading-tight text-white"
              >
                {isSpeaking ? "Sofía DJ — En Directo" : (currentTrack?.title || "SOFIA DJ")}
              </motion.h2>
              <p className="text-white/60 text-sm sm:text-base sm:text-[13px] font-bold truncate">
                {isSpeaking ? "Actualidad, Tendencias y Mix de Éxitos" : (currentTrack?.artist || "Tu DJ")}
              </p>
            </div>
            
            {!isSpeaking && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    if (currentTrack && onToggleFavorite) {
                      onToggleFavorite(currentTrack, e);
                    }
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 rounded-full transition-all ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'text-[#1ED760]' : 'text-white/40 hover:text-white'}`}
                >
                  <Heart className={`w-5 h-5 ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'fill-current' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar & Time */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="relative h-1 bg-white/10 rounded-full mb-2.5">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{ width: `${actualProgress}%` }}
            />
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full shadow-[0_0_15px_white] z-20"
              style={{ left: `${actualProgress}%`, marginLeft: '-5px' }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] sm:text-xs sm:text-lg sm:text-xl font-black tracking-[0.15em] text-white/30">
            <span>{formatTime(displayPosition)} / {formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Main Playback Controls */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 pointer-events-none opacity-0" />
          
          <div className="flex items-center gap-5 sm:gap-6">
            <button 
              onClick={() => {
                // Seek logic goes here if implemented, or ignore for radio
              }}
              className="text-white/40 hover:text-white transition-all transform active:scale-90"
              disabled={isSpeaking}
            >
              <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            </button>
            
            <button
              onClick={toggleRadio}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {showPauseIcon ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
            </button>
            
            <button 
              onClick={() => handleNextTrack(true)}
              className="text-white hover:scale-110 active:scale-90 transition-all"
            >
              <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-1.5 group/vol w-12 sm:w-20">
            <button 
              onClick={() => onVolumeChange && onVolumeChange(volume > 0 ? 0 : 100)}
              className="text-white/40 group-hover/vol:text-white transition-colors shrink-0"
            >
              <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 sm:w-5 sm:h-5" />
            </button>
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

      {/* Settings Modal Overlay */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center"
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
              <div className="bg-[#1a1c23]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-y-auto premium-scrollbar shadow-inner flex-1 min-h-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                 
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

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setShowConfig(false)}
                  className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-black uppercase tracking-widest text-sm sm:text-base hover:bg-white/10 transition-colors"
                >
                  Cerrar
                </button>
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
