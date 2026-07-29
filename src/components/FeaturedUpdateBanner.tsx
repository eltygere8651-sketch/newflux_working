import React, { useEffect, useState, useRef } from "react";
import { Play, Eye, Sparkles, Volume2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { collection, query, getDocs, doc, deleteDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

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
  isAdmin?: boolean;
}

export const FeaturedUpdateBanner: React.FC<FeaturedUpdateBannerProps> = ({
  onPlayPlaylist,
  onViewPlaylist,
  isAdmin = false,
}) => {
  const [activeItems, setActiveItems] = useState<FeaturedUpdateItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [direction, setDirection] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchFeaturedUpdates = async () => {
    try {
      setLoading(true);
      
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

        if (isActive && notExpired) {
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

      // Remove duplicate playlists (keep most recent based on the sort above)
      const uniqueItems = validItems.filter((item, index, self) =>
        index === self.findIndex((t) => t.playlistId === item.playlistId)
      );

      if (uniqueItems.length > 0) {
        setActiveItems(uniqueItems);
        setCurrentIndex(0);
        setIsVisible(true);
      } else {
        setActiveItems([]);
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

  useEffect(() => {
    if (!isVisible || activeItems.length <= 1 || !isInView) return;
    
    const interval = setInterval(() => {
      // Pause auto-sliding if the tab is not visible or screen is locked
      if (document.hidden) return;
      
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }, 60000);

    return () => clearInterval(interval);
  }, [isVisible, activeItems.length, isInView]);

  const nextItem = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
  };

  const prevItem = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  };


  const handlePlay = () => {
    const activeItem = activeItems[currentIndex];
    if (activeItem) {
      onPlayPlaylist(activeItem);
    }
  };

  const handleView = () => {
    const activeItem = activeItems[currentIndex];
    if (activeItem) {
      onViewPlaylist(activeItem);
    }
  };

  const handleDeletePermanently = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const activeItem = activeItems[currentIndex];
    if (!activeItem || !activeItem.docId) return;
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    const activeItem = activeItems[currentIndex];
    if (!activeItem || !activeItem.playlistId) return;
    try {
      // Find all featured updates with this playlistId and delete them all (in case there are duplicates)
      const q = query(
        collection(db, "featured_updates"),
        where("playlistId", "==", activeItem.playlistId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(docSnap => 
        deleteDoc(doc(db, "featured_updates", docSnap.id))
      );
      await Promise.all(deletePromises);

      // Fallback: Also try deleting by docId just in case the query failed to match
      if (activeItem.docId) {
        try {
          await deleteDoc(doc(db, "featured_updates", activeItem.docId));
        } catch (e) {}
      }

      // Remove locally
      const newItems = [...activeItems];
      newItems.splice(currentIndex, 1);
      if (newItems.length > 0) {
        setActiveItems(newItems);
        if (currentIndex >= newItems.length) {
          setCurrentIndex(0);
        }
      } else {
        setIsVisible(false);
      }
      window.dispatchEvent(new Event("refreshFeaturedUpdates"));
    } catch (error) {
      console.error("Error al eliminar la promoción:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextItem();
    }
    if (isRightSwipe) {
      prevItem();
    }
  };

  if (!isVisible || activeItems.length === 0 || loading) {
    return null;
  }

  const activeItem = activeItems[currentIndex];
  const imageUrl = activeItem.image || activeItem.thumbnail || `https://i.ytimg.com/vi/${activeItem.playlistId}/hqdefault.jpg`;
  const genreTag = activeItem.genre || "DESTACADO";

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 50 : -50,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0
      };
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full mb-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#121212] border border-[#1ED760]/20 shadow-xl group min-h-[120px]">
        
        {/* Glow ambient effect */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#1ED760]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#1ED760]/20 transition-all duration-700" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {activeItems.length > 1 && (
          <>
            <button
              onClick={prevItem}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 z-30 transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextItem}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 z-30 transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30">
              {activeItems.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "bg-[#1ED760] w-2.5" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeItem.id || currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="relative z-10 flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full w-full"
          >
            {/* Cover image thumbnail */}
            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
              <img
                src={imageUrl}
                alt={activeItem.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${activeItem.playlistId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-[#1ED760] flex items-center gap-0.5">
                <Volume2 className="w-2 h-2 animate-pulse" />
                <span>FLUX</span>
              </div>
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0 text-left flex flex-col justify-center pr-6 sm:pr-0">
              <div className="flex items-center justify-start gap-1.5 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#1ED760]/10 text-[#1ED760] border border-[#1ED760]/20 tracking-wider uppercase">
                  <Sparkles className="w-2.5 h-2.5 text-[#1ED760]" />
                  DESTACADO
                </span>
              </div>
              
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-1 group-hover:text-[#1ED760] transition-colors">
                {activeItem.title}
              </h3>
              
              {activeItem.description && (
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-relaxed font-medium">
                  {activeItem.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-start gap-2 mt-2">
                <button
                  onClick={handlePlay}
                  className="bg-[#1ED760] text-black hover:bg-[#1fdb62] active:scale-95 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1 shadow-lg shadow-[#1ED760]/20"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>Reproducir</span>
                </button>
                <button
                  onClick={handleView}
                  className="bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-all border border-white/5 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Ver detalles</span>
                  <span className="sm:hidden">Ver</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={handleDeletePermanently}
                    className="ml-auto bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 active:scale-95 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-all border border-red-500/20 flex items-center gap-1"
                    title="Eliminar promoción para todos"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Eliminar Promoción
            </h3>
            <p className="text-sm text-slate-300 mb-6">
              ¿Estás seguro de que quieres eliminar esta promoción para todos los usuarios?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  executeDelete();
                }}
                className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
