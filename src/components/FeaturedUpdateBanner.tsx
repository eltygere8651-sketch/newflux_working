import React, { useEffect, useState } from "react";
import { Play, Eye, X, Sparkles, Music2, Volume2 } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface FeaturedUpdateItem {
  id?: string;
  docId?: string;
  playlistId: string;
  title: string;
  image?: string;
  thumbnail?: string;
  genre?: string;
  description?: string;
  publishedAt?: number;
  expiresAt?: number;
  priority?: number;
  active?: boolean;
  durationHours?: number;
}

interface FeaturedUpdateBannerProps {
  onPlayPlaylist: (update: FeaturedUpdateItem) => void;
  onViewPlaylist: (update: FeaturedUpdateItem) => void;
}

const LOCAL_STORAGE_KEY = "seen_featured_updates";

const getSeenUpdates = (): string[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markUpdateAsSeen = (id: string) => {
  try {
    const seen = getSeenUpdates();
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seen));
    }
  } catch (e) {
    console.warn("Could not save seen update to localStorage:", e);
  }
};

export const FeaturedUpdateBanner: React.FC<FeaturedUpdateBannerProps> = ({
  onPlayPlaylist,
  onViewPlaylist,
}) => {
  const [activeItem, setActiveItem] = useState<FeaturedUpdateItem | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFeaturedUpdates = async () => {
    try {
      setLoading(true);
      const seenIds = getSeenUpdates();
      
      // Simple collection query without composite index requirement
      const q = query(
        collection(db, "featured_updates")
      );

      const snapshot = await getDocs(q);
      const now = Date.now();
      const validItems: FeaturedUpdateItem[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as FeaturedUpdateItem;
        const itemId = docSnap.id || data.playlistId;

        const isActive = data.active !== false; // default true if missing
        const notExpired = !data.expiresAt || data.expiresAt > now;
        const notSeen = !seenIds.includes(itemId) && !seenIds.includes(data.playlistId);

        if (isActive && notExpired && notSeen) {
          validItems.push({
            ...data,
            id: itemId,
            docId: docSnap.id,
            publishedAt: data.publishedAt || now,
          });
        }
      });

      // Sort by publishedAt descending in memory
      validItems.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

      if (validItems.length > 0) {
        setActiveItem(validItems[0]);
        setIsVisible(true);
      } else {
        setActiveItem(null);
        setIsVisible(false);
      }
    } catch (err) {
      console.warn("Featured updates check notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedUpdates();

    // Event listener for real-time local update after admin action
    const handleRefresh = () => fetchFeaturedUpdates();
    window.addEventListener("refreshFeaturedUpdates", handleRefresh);
    return () => window.removeEventListener("refreshFeaturedUpdates", handleRefresh);
  }, []);

  const handleClose = () => {
    if (activeItem) {
      const idToMark = activeItem.docId || activeItem.id || activeItem.playlistId;
      markUpdateAsSeen(idToMark);
      if (activeItem.playlistId) markUpdateAsSeen(activeItem.playlistId);
    }
    setIsVisible(false);
  };

  const handlePlay = () => {
    if (activeItem) {
      const idToMark = activeItem.docId || activeItem.id || activeItem.playlistId;
      markUpdateAsSeen(idToMark);
      if (activeItem.playlistId) markUpdateAsSeen(activeItem.playlistId);
      setIsVisible(false);
      onPlayPlaylist(activeItem);
    }
  };

  const handleView = () => {
    if (activeItem) {
      const idToMark = activeItem.docId || activeItem.id || activeItem.playlistId;
      markUpdateAsSeen(idToMark);
      if (activeItem.playlistId) markUpdateAsSeen(activeItem.playlistId);
      setIsVisible(false);
      onViewPlaylist(activeItem);
    }
  };

  if (!isVisible || !activeItem || loading) {
    return null;
  }

  const imageUrl = activeItem.image || activeItem.thumbnail || `https://i.ytimg.com/vi/${activeItem.playlistId}/hqdefault.jpg`;
  const genreTag = activeItem.genre || "NUEVA PLAYLIST";

  return (
    <div className="w-full mb-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d2218]/90 via-[#121824]/95 to-[#0b111e]/90 border border-[#1ED760]/30 shadow-2xl backdrop-blur-xl p-4 sm:p-5 group">
        {/* Glow ambient effect */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#1ED760]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#1ED760]/25 transition-all duration-700" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss / Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
          title="Cerrar x"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          {/* Cover image thumbnail */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden shadow-xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
            <img
              src={imageUrl}
              alt={activeItem.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${activeItem.playlistId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-[#1ED760] flex items-center gap-1">
              <Volume2 className="w-2.5 h-2.5 animate-pulse" />
              <span>FLUX</span>
            </div>
          </div>

          {/* Content info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1ED760]/20 text-[#1ED760] border border-[#1ED760]/30 tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-[#1ED760] animate-spin" style={{ animationDuration: '4s' }} />
                NUEVA PLAYLIST DISPONIBLE
              </span>
              {genreTag && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 uppercase">
                  {genreTag}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight line-clamp-1 group-hover:text-[#1ED760] transition-colors">
              {activeItem.title}
            </h3>

            {activeItem.description && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
                {activeItem.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <button
                onClick={handlePlay}
                className="bg-[#1ED760] text-black hover:bg-[#1fdb62] hover:scale-105 active:scale-95 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-[#1ED760]/20"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Reproducir ahora</span>
              </button>

              <button
                onClick={handleView}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-full transition-all border border-white/10 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
