import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  ListPlus,
  ListMusic,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  Loader2,
  Plus,
  Settings2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  Trash2,
  FolderOutput,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MusicTrack } from "../types";
import { DEFAULT_MUSIC_COVER } from "../lib/constants";
import { Carousel } from "./Carousel";
import { FeaturedUpdateBanner } from "./FeaturedUpdateBanner";
import { PromotePlaylistModal } from "./PromotePlaylistModal";

import { LazyImage } from "./LazyImage";

interface ExploreViewProps {
  exploreData: any;
  customPlaylists?: any[];
  exploreLayout?: any[] | null;
  isAdmin?: boolean;
  onAddCustomPlaylist?: (url: string, sectionId?: string) => Promise<void>;
  onDeleteCustomPlaylist?: (docId: string) => Promise<void>;
  onUpdateExploreLayout?: (layout: any[]) => Promise<void>;
  setOverrideCurrentTrack: (track: MusicTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  showNotification: (msg: string) => void;
  addYoutubeTrackToPlaylist: (track: any) => void;
  loadPlaylistAndPlay: (item: any) => void;
  playTracksContext?: (tracks: any[], startIndex: number) => void;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
  currentTrack?: MusicTrack | null;
  isPlaying?: boolean;
}

const cleanUrl = (url?: any) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("i.ytimg.com")) {
    let clean = url.split("?")[0];
    if (clean.endsWith("hqdefault.jpg")) {
      clean = clean.replace("hqdefault.jpg", "hqdefault.jpg");
    }
    return clean;
  }
  if (url.includes("googleusercontent.com")) {
    return url.replace(/=w\d+-h\d+/, "=w512-h512").replace(/=s\d+/, "=s512");
  }
  return url;
};

const getTrackImage = (track?: any): string | null => {
  if (!track) return null;
  if (track.thumbnail) return cleanUrl(track.thumbnail);
  if (track.thumbnail_url) return cleanUrl(track.thumbnail_url);
  if (track.thumbnails && track.thumbnails.length > 0 && track.thumbnails[0]?.url) return cleanUrl(track.thumbnails[0].url);
  if (track.imageUrl) return cleanUrl(track.imageUrl);
  if (track.artwork_url) return cleanUrl(track.artwork_url);
  if (track.artwork) return cleanUrl(track.artwork);
  if (
    track.url &&
    typeof track.url === "string" &&
    (track.url.includes("youtube.com") || track.url.includes("youtu.be"))
  ) {
    const match = track.url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
    if (match && match[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }
  if (typeof track.id === "string" && track.id.startsWith("yt_")) {
    const parts = track.id.split("_");
    const vid = parts[1] === "temp" ? parts[2] : parts[1];
    if (vid && vid.length >= 10) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  }
  if (track.id && typeof track.id === "string" && track.id.length === 11) {
    return `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
  }
  return null;
};

const getItemImage = (item: any): string => {
  if (item.thumbnail) return cleanUrl(item.thumbnail);
  if (item.thumbnail_url) return cleanUrl(item.thumbnail_url);
  if (item.thumbnails && item.thumbnails.length > 0 && item.thumbnails[0]?.url) return cleanUrl(item.thumbnails[0].url);
  if (item.imageUrl) return cleanUrl(item.imageUrl);
  if (item.artwork_url) return cleanUrl(item.artwork_url);
  if (item.artwork) return cleanUrl(item.artwork);
  
  if (item.isPlaylist && item.data && item.data.tracks && item.data.tracks.length > 0) {
    const trackImg = getTrackImage(item.data.tracks[0]);
    if (trackImg) return cleanUrl(trackImg);
  }
  
  if (item.tracks && item.tracks.length > 0) {
    const trackImg = getTrackImage(item.tracks[0]);
    if (trackImg) return cleanUrl(trackImg);
  }
  
  const selfImg = getTrackImage(item);
  if (selfImg) return cleanUrl(selfImg);

  if (item.id && typeof item.id === "string" && item.id.length === 11) {
    return `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
  }
  
  return "";
};

export const ExploreView: React.FC<ExploreViewProps> = React.memo(
  ({
    exploreData,
    customPlaylists = [],
    exploreLayout,
    isAdmin,
    onAddCustomPlaylist,
    onDeleteCustomPlaylist,
    onUpdateExploreLayout,
    setOverrideCurrentTrack,
    setIsPlaying,
    showNotification,
    addYoutubeTrackToPlaylist,
    loadPlaylistAndPlay,
    playTracksContext,
    selectedCountry,
    setSelectedCountry,
    currentTrack,
    isPlaying,
  }) => {
    const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newPlaylistUrl, setNewPlaylistUrl] = useState("");
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("custom_0");
    const [isAdding, setIsAdding] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [promoteTarget, setPromoteTarget] = useState<{
      id: string;
      title: string;
      thumbnail?: string;
      artist?: string;
      description?: string;
    } | null>(null);

    const [moveTarget, setMoveTarget] = useState<{
      docId?: string;
      itemId: string;
      title: string;
      thumbnail?: string;
      currentSectionId?: string;
      url?: string;
      isPlaylist?: boolean;
      artist?: string;
      trackCount?: number;
      description?: string;
    } | null>(null);
    const [targetSectionId, setTargetSectionId] = useState<string>("");
    const [newCategoryName, setNewCategoryName] = useState<string>("");
    const [isMoving, setIsMoving] = useState<boolean>(false);

    const [itemToDelete, setItemToDelete] = useState<{
      docId?: string;
      sectionId?: string;
      itemId?: string;
    } | null>(null);

    const handleHideItem = async (sectionId: string, itemId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const sectionIndex = newLayout.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return;

      const section = newLayout[sectionIndex];
      const hiddenItems = section.hiddenItems ? [...section.hiddenItems] : [];
      if (!hiddenItems.includes(itemId)) {
        hiddenItems.push(itemId);
      }

      newLayout[sectionIndex] = { ...section, hiddenItems };
      await onUpdateExploreLayout(newLayout);
    };
    const [editingSectionId, setEditingSectionId] = useState<string | null>(
      null,
    );
    const [editingSectionTitle, setEditingSectionTitle] = useState("");
    const [draggedItem, setDraggedItem] = useState<{
      sectionId: string;
      itemId: string;
      index: number;
    } | null>(null);
    const [dragOverItem, setDragOverItem] = useState<{
      sectionId: string;
      index: number;
    } | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

    const COUNTRIES = [
      { code: "GLOBAL", label: "Global", flag: "🌎" },
      { code: "US", label: "Estados Unidos", flag: "🇺🇸" },
      { code: "ES", label: "España", flag: "🇪🇸" },
      { code: "MX", label: "México", flag: "🇲🇽" },
      { code: "AR", label: "Argentina", flag: "🇦🇷" },
      { code: "CO", label: "Colombia", flag: "🇨🇴" },
      { code: "DO", label: "República Dominicana", flag: "🇩🇴" },
      { code: "CL", label: "Chile", flag: "🇨🇱" },
      { code: "PE", label: "Perú", flag: "🇵🇪" },
      { code: "GB", label: "Reino Unido", flag: "🇬🇧" },
      { code: "DE", label: "Alemania", flag: "🇩🇪" },
      { code: "FR", label: "Francia", flag: "🇫🇷" },
      { code: "IT", label: "Italia", flag: "🇮🇹" },
    ];

    if (
      !exploreData ||
      (exploreData.top100?.length === 0 && exploreData.trending?.length === 0)
    ) {
      return (
        <div className="p-12 text-center space-y-4">
          <div className="flex justify-center">
            <Sparkles className="w-8 h-8 text-emerald-500/30 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            No se han podido cargar las tendencias en este momento.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white hover:bg-white/10 transition-all"
          >
            Reintentar
          </button>
        </div>
      );
    }

    const defaultLayout = [
      {
        id: "custom_0",
        title: "💎 Recomendaciones Especiales",
        type: "custom",
        visible: true,
        order: 0,
      },
      {
        id: "mixParaTi",
        title: "✨ Mixes Para Ti",
        type: "default",
        visible: true,
        order: 1,
      },
      {
        id: "top100",
        title: "Top 100 Playlists",
        type: "default",
        visible: true,
        order: 2,
      },
      {
        id: "top20",
        title: "Top 20 Tendencias",
        type: "default",
        visible: true,
        order: 3,
      },
      {
        id: "daily20",
        title: "Daily Top 20",
        type: "default",
        visible: true,
        order: 4,
      },
      {
        id: "dailyTop",
        title: "Nuevos Videos Musicales",
        type: "default",
        visible: true,
        order: 5,
      },
      {
        id: "trending",
        title: "Tendencias Globales",
        type: "default",
        visible: true,
        order: 6,
      },
      {
        id: "pop",
        title: "🎵 Pop Playlists",
        type: "default",
        visible: true,
        order: 7,
      },
    ];

    let currentLayout =
      exploreLayout && exploreLayout.length > 0 ? exploreLayout : defaultLayout;
    // Ensure any new default sections that arent in the saved layout are appended
    const existingSectionIds = new Set(currentLayout.map((s: any) => s.id));
    defaultLayout.forEach((defaultSec) => {
      if (!existingSectionIds.has(defaultSec.id)) {
        currentLayout = [...currentLayout, { ...defaultSec, order: currentLayout.length }];
      }
    });

    const sortedLayout = [...currentLayout].sort((a, b) => a.order - b.order);

    const getSectionData = (section: any) => {
      let data: any[] = [];

      // Load default data for non-custom sections
      if (section.type !== "custom") {
        switch (section.id) {
          case "mixParaTi":
            data = exploreData.mixParaTi || [];
            break;
          case "top100":
            data = exploreData.top100 || [];
            break;
          case "top20":
            data = exploreData.top20Tendencias || [];
            break;
          case "daily20":
            data = exploreData.dailyTopPlaylists || [];
            break;
          case "dailyTop":
            data = exploreData.dailyTop || [];
            break;
          case "trending":
            data = exploreData.trending || [];
            break;
          case "pop":
            data = exploreData.pop || [];
            break;
          default:
            data = [];
            break;
        }
      }

      // Add custom playlists for this section (works for BOTH custom and default sections)
      const customItemsForSection = customPlaylists.filter(
        (p: any) =>
          p.sectionId === section.id ||
          (!p.sectionId && section.id === "custom_0"),
      );

      data = [...data, ...customItemsForSection];

      if (section.hiddenItems && Array.isArray(section.hiddenItems)) {
        data = data.filter((d) => !section.hiddenItems.includes(d.id || d.url));
      }

      if (section.customItemOrder && Array.isArray(section.customItemOrder)) {
        data = [...data].sort((a, b) => {
          const idA = a.id || a.url;
          const idB = b.id || b.url;
          const idxA = section.customItemOrder.indexOf(idA);
          const idxB = section.customItemOrder.indexOf(idB);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA === -1 && idxB !== -1) return -1;
          if (idxB === -1 && idxA !== -1) return 1;
          return 0;
        });
      }
      return data;
    };

    const sectionsToRender = sortedLayout
      .filter((s) => s.visible || isAdmin)
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        visible: s.visible,
        data: getSectionData(s),
      }))
      .filter(
        (s) =>
          (s.data && s.data.length > 0) || (isAdmin && s.type === "custom"),
      );

    const handleMoveSection = async (
      sectionId: string,
      direction: "up" | "down",
    ) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;

      if (direction === "up" && index > 0) {
        const temp = newLayout[index];
        newLayout[index] = newLayout[index - 1];
        newLayout[index - 1] = temp;
      } else if (direction === "down" && index < newLayout.length - 1) {
        const temp = newLayout[index];
        newLayout[index] = newLayout[index + 1];
        newLayout[index + 1] = temp;
      } else {
        return;
      }
      newLayout.forEach((s, i) => (s.order = i));
      await onUpdateExploreLayout(newLayout);
    };

    const handleToggleVisibility = async (sectionId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;
      newLayout[index].visible = !newLayout[index].visible;
      await onUpdateExploreLayout(newLayout);
    };

    const handleRenameSection = async (sectionId: string) => {
      if (!onUpdateExploreLayout || !editingSectionTitle.trim()) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;
      newLayout[index].title = editingSectionTitle.trim();
      await onUpdateExploreLayout(newLayout);
      setEditingSectionId(null);
      setEditingSectionTitle("");
    };

    const handleDeleteSection = async (sectionId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = sortedLayout.filter((s) => s.id !== sectionId);
      newLayout.forEach((s, i) => (s.order = i));
      await onUpdateExploreLayout(newLayout);
      setSectionToDelete(null);
    };

    const handleDropItem = async (
      sectionId: string,
      itemId: string,
      targetIndex: number,
    ) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const sectionIndex = newLayout.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return;

      const section = newLayout[sectionIndex];
      const currentData = getSectionData(section);

      const itemOrder = currentData.map((d) => d.id || d.url);

      const itemIndex = itemOrder.indexOf(itemId);
      if (itemIndex === -1) return;

      const [removed] = itemOrder.splice(itemIndex, 1);

      // If we are dropping to a later index, and we removed an item before it,
      // the array is now 1 element shorter. So targetIndex remains the same
      // to insert exactly where the user hovered. Wait, the array `splice` with targetIndex handles this if it's the raw array index.
      itemOrder.splice(targetIndex, 0, removed);

      newLayout[sectionIndex] = { ...section, customItemOrder: itemOrder };
      await onUpdateExploreLayout(newLayout);
    };

    const handleAddSubmit = async () => {
      if (!newPlaylistUrl || !onAddCustomPlaylist) return;
      setIsAdding(true);
      await onAddCustomPlaylist(newPlaylistUrl, selectedSectionId);

      setNewPlaylistUrl("");
      setShowAddModal(false);
      setIsAdding(false);
    };

    const handleAddSectionSubmit = async () => {
      if (!onUpdateExploreLayout || !newSectionTitle.trim()) return;
      setIsAdding(true);
      const newLayout = [...sortedLayout];
      newLayout.push({
        id: "custom_" + Date.now(),
        title: newSectionTitle.trim(),
        type: "custom",
        visible: true,
        order: newLayout.length,
      });
      await onUpdateExploreLayout(newLayout);
      setNewSectionTitle("");
      setShowAddSectionModal(false);
      setIsAdding(false);
    };

    const handleConfirmMoveCategory = async () => {
      if (!moveTarget) return;
      setIsMoving(true);
      try {
        let finalSectionId = targetSectionId;

        if (targetSectionId === "CREATE_NEW") {
          if (!newCategoryName.trim()) return;
          finalSectionId = "custom_" + Date.now();
          if (onUpdateExploreLayout) {
            const newLayout = [...sortedLayout];
            newLayout.push({
              id: finalSectionId,
              title: newCategoryName.trim(),
              type: "custom",
              visible: true,
              order: newLayout.length,
            });
            await onUpdateExploreLayout(newLayout);
          }
        }

        if (moveTarget.docId) {
          const docRef = doc(db, "explore_custom_playlists", moveTarget.docId);
          await updateDoc(docRef, { sectionId: finalSectionId });
          showNotification("Playlist movida de categoría correctamente");
          window.dispatchEvent(new Event("refreshExplore"));
        } else {
          const matchCustom = customPlaylists.find(
            (p: any) => p.id === moveTarget.itemId || p.url === moveTarget.url || (p.title && p.title === moveTarget.title)
          );
          if (matchCustom && matchCustom.docId) {
            const docRef = doc(db, "explore_custom_playlists", matchCustom.docId);
            await updateDoc(docRef, { sectionId: finalSectionId });
            showNotification("Playlist movida de categoría correctamente");
            window.dispatchEvent(new Event("refreshExplore"));
          } else if (onAddCustomPlaylist) {
            const targetUrl = moveTarget.url || `https://music.youtube.com/playlist?list=${moveTarget.itemId}`;
            await onAddCustomPlaylist(targetUrl, finalSectionId);
            showNotification("Playlist fijada en la nueva categoría");
            window.dispatchEvent(new Event("refreshExplore"));
          }
        }
      } catch (err: any) {
        console.error("Error moving playlist category:", err);
        showNotification("Error al mover categoría: " + (err.message || "Desconocido"));
      } finally {
        setIsMoving(false);
        setMoveTarget(null);
        setNewCategoryName("");
      }
    };

    return (
      <div className="space-y-6 pb-6 px-0">
        {/* FEATURED UPDATE PROMOTION BANNER */}
        <div className="px-3">
          <FeaturedUpdateBanner
            isAdmin={isAdmin}
            onPlayPlaylist={(update) => {
              if (loadPlaylistAndPlay) {
                loadPlaylistAndPlay({
                  id: update.playlistId,
                  title: update.title,
                  thumbnail: update.image || update.thumbnail,
                  artist: update.genre,
                  description: update.description,
                  isPlaylist: true
                });
              }
            }}
            onViewPlaylist={(update) => {
              if (loadPlaylistAndPlay) {
                loadPlaylistAndPlay({
                  id: update.playlistId,
                  title: update.title,
                  thumbnail: update.image || update.thumbnail,
                  artist: update.genre,
                  description: update.description,
                  isPlaylist: true
                });
              }
            }}
          />
        </div>

        {/* COUNTRY SELECTOR & ADMIN ACTIONS */}
        <div className="px-3 flex items-center justify-between gap-3 flex-wrap">
          {setSelectedCountry && selectedCountry && (
            <div className="relative max-w-[200px] w-full">
              <button
                onClick={() => setIsCountryModalOpen(!isCountryModalOpen)}
                className="w-full text-left bg-[#111113] border border-white/10 text-white rounded-full px-4 py-2 text-[11px] font-bold outline-none focus:border-[#1ED760]/50 hover:bg-white/[0.05] transition-colors cursor-pointer flex justify-between items-center"
              >
                <span className="truncate">
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.flag} Top
                  Listas{" "}
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#1ED760] shrink-0 transition-transform ${isCountryModalOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isCountryModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => setIsCountryModalOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 z-[50] w-full min-w-[220px] bg-[#18181A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setSelectedCountry(c.code);
                            setIsCountryModalOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${selectedCountry === c.code ? "bg-[#1ED760]/10 text-[#1ED760] font-bold" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                        >
                          <span className="text-xl">{c.flag}</span>
                          <span className="text-xs">{c.label}</span>
                          {selectedCountry === c.code && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1ED760]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-full text-[11px] font-bold transition-colors border border-white/10 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Categoría</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-[#1ED760]/10 hover:bg-[#1ED760]/20 text-[#1ED760] px-3 py-2 rounded-full text-[11px] font-bold transition-colors border border-[#1ED760]/20 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Lista / Video</span>
              </button>
            </div>
          )}
        </div>

        {showAddSectionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                Nueva Categoría
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Crea un nuevo carrusel para añadir tus propias listas de
                reproducción y videos.
              </p>

              <input
                type="text"
                placeholder="Ej: Nuevos Álbums"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors mb-6"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                  disabled={isAdding}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSectionSubmit}
                  disabled={!newSectionTitle.trim() || isAdding}
                  className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full disabled:opacity-50 flex items-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Crear Categoría"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {itemToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Eliminar Lista
              </h3>
              <p className="text-sm text-slate-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta lista recomendada?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (itemToDelete.docId && onDeleteCustomPlaylist) {
                      onDeleteCustomPlaylist(itemToDelete.docId);
                    } else if (itemToDelete.sectionId && itemToDelete.itemId) {
                      handleHideItem(
                        itemToDelete.sectionId,
                        itemToDelete.itemId,
                      );
                    }
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {sectionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                Eliminar Categoría
              </h3>
              <p className="text-sm text-slate-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta categoría? Se ocultará
                de la vista de los usuarios.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSectionToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteSection(sectionToDelete)}
                  className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1ED760]" />
                Añadir al Explorador
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pega el enlace de una lista o video de YouTube Music para
                fijarlo en el Explorador.
              </p>

              <input
                type="text"
                placeholder="https://music.youtube.com/playlist?list=... o watch?v=..."
                value={newPlaylistUrl}
                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#1ED760]/50 transition-colors mb-4"
                disabled={isAdding}
              />

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 mb-2 block">
                  Categoría destino:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1ED760] transition-colors appearance-none"
                >
                  {sortedLayout.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                  {sortedLayout.length === 0 && (
                    <option value="custom_0">
                      💎 Recomendaciones Especiales
                    </option>
                  )}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                  disabled={isAdding}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={!newPlaylistUrl || isAdding}
                  className="px-4 py-2 bg-[#1ED760] text-black text-xs font-bold rounded-full disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Añadir Lista"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {sectionsToRender.map((section, idx) => (
          <section
            key={section.id}
            className={`space-y-3 relative group/section ${!section.visible ? "opacity-50 grayscale" : ""}`}
          >
            <Carousel
              title={
                <div className="flex items-center justify-between w-full">
                  {editingSectionId === section.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSectionTitle}
                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameSection(section.id);
                          } else if (e.key === "Escape") {
                            setEditingSectionId(null);
                            setEditingSectionTitle("");
                          }
                        }}
                        autoFocus
                        className="bg-black/50 border border-[#1ED760]/50 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none w-48"
                      />
                      <button
                        onClick={() => handleRenameSection(section.id)}
                        className="p-1 text-[#1ED760] hover:bg-[#1ED760]/20 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSectionId(null);
                          setEditingSectionTitle("");
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer hover:underline w-fit">
                      {section.title}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </h2>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/section:opacity-100 transition-opacity bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 ml-4">
                      <button
                        onClick={() => {
                          setEditingSectionId(section.id);
                          setEditingSectionTitle(section.title);
                        }}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Renombrar sección"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <button
                        onClick={() => handleMoveSection(section.id, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="Subir sección"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(section.id, "down")}
                        disabled={idx === sectionsToRender.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                        title="Bajar sección"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <button
                        onClick={() => handleToggleVisibility(section.id)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title={
                          section.visible ? "Ocultar sección" : "Mostrar sección"
                        }
                      >
                        {section.visible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                      {section.type === "custom" && (
                        <button
                          onClick={() => setSectionToDelete(section.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              }
              className="gap-4 pb-2 snap-x px-3 sm:px-1 min-h-[140px]"
            >
              {(!section.data || section.data.length === 0) && (
                <div className="w-full flex items-center justify-center p-8 border border-dashed border-white/10 rounded-xl text-slate-400 text-xs">
                  No hay elementos en esta categoría. Usa "Añadir Lista / Video"
                  para agregar contenido.
                </div>
              )}
              {section.data &&
                section.data.slice(0, expandedSections[section.id] ? undefined : 12).map((item: any, songIdx: number) => {
                  const isActive =
                    currentTrack &&
                    (currentTrack.url === item.url ||
                      currentTrack.id === item.id);
                  const itemId = item.id || item.url || item.title || `index-${songIdx}`;

                  return (
                    <div
                      key={itemId + idx + songIdx}
                      className={`snap-start shrink-0 w-[130px] sm:w-36 group cursor-pointer relative transition-all ${draggedItem?.itemId === itemId ? "opacity-50 scale-95" : ""} ${dragOverItem?.sectionId === section.id && dragOverItem?.index === songIdx ? "border-l-2 border-[#1ED760] pl-1 -ml-1" : ""}`}
                      draggable={isAdmin}
                      onDragStart={(e) => {
                        if (isAdmin) {
                          setDraggedItem({
                            sectionId: section.id,
                            itemId,
                            index: songIdx,
                          });
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", itemId);
                        }
                      }}
                      onDragOver={(e) => {
                        if (isAdmin && draggedItem) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (
                            dragOverItem?.sectionId !== section.id ||
                            dragOverItem?.index !== songIdx
                          ) {
                            setDragOverItem({
                              sectionId: section.id,
                              index: songIdx,
                            });
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        if (
                          isAdmin &&
                          dragOverItem?.sectionId === section.id &&
                          dragOverItem?.index === songIdx
                        ) {
                          setDragOverItem(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (isAdmin && draggedItem) {
                          e.preventDefault();
                          if (
                            draggedItem.sectionId === section.id &&
                            draggedItem.itemId !== itemId
                          ) {
                            handleDropItem(
                              section.id,
                              draggedItem.itemId,
                              songIdx,
                            );
                          }
                          setDraggedItem(null);
                          setDragOverItem(null);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedItem(null);
                        setDragOverItem(null);
                      }}
                      onClick={() => {
                        if (item.isPlaylist) {
                          loadPlaylistAndPlay(item.data || item);
                          return;
                        }

                        if (isActive) {
                          setIsPlaying(!isPlaying);
                          return;
                        }

                        if (playTracksContext) {
                          const songsOnly = section.data.filter(
                            (t: any) => !t.isPlaylist,
                          );
                          const idxInSongs = songsOnly.findIndex(
                            (t: any) => t.id === item.id,
                          );
                          playTracksContext(
                            songsOnly,
                            idxInSongs !== -1 ? idxInSongs : 0,
                          );
                        } else {
                          const mapped: MusicTrack = {
                            id: item.id,
                            title: item.title,
                            artist: item.artist || "Artista",
                            url: `https://www.youtube.com/watch?v=${item.id}`,
                            duration: item.duration || "0:00",
                            bpm: 120,
                            thumbnail: item.thumbnail || item.thumbnail_url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                          };
                          setOverrideCurrentTrack(mapped);
                          setIsPlaying(true);
                          showNotification(`Reproduciendo: ${item.title}`);
                        }
                      }}
                    >
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#111113] border border-white/5 relative mb-2.5">
                        <LazyImage
                          src={getItemImage(item)}
                          fallbackSrc={DEFAULT_MUSIC_COVER}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          wrapperClassName="absolute inset-0"
                          referrerPolicy="no-referrer"
                          onImageError={(e, setSrc) => {
                            const handleSetSrc = (src: string) => {
                              item.thumbnail = src;
                              item.imageUrl = src;
                              setSrc(src);
                              if (item.docId) {
                                updateDoc(doc(db, "explore_custom_playlists", item.docId), { thumbnail: src }).catch(() => {});
                              }
                            };
                            if (item.id) {
                              const isPlaylist = item.isPlaylist || item.id.startsWith("PL") || item.id.startsWith("MPRE");
                              if (isPlaylist) {
                                fetch(`/api/youtube/playlist?id=${item.id}`)
                                  .then(res => {
                                    if (!res.ok) throw new Error("Backend error");
                                    return res.json();
                                  })
                                  .then(tracks => {
                                    if (Array.isArray(tracks) && tracks.length > 0 && tracks[0].id) {
                                      handleSetSrc(`https://i.ytimg.com/vi/${tracks[0].id}/hqdefault.jpg`);
                                    } else {
                                      throw new Error("No tracks");
                                    }
                                  })
                                  .catch(() => {
                                    const fallbackUrl = `https://pipedapi.kavin.rocks/playlists/${item.id}`;
                                    fetch(fallbackUrl)
                                      .then(r => r.json())
                                      .then(d => {
                                        if (d && d.relatedStreams && d.relatedStreams.length > 0) {
                                           handleSetSrc(`https://i.ytimg.com/vi/${d.relatedStreams[0].url.replace("/watch?v=", "")}/hqdefault.jpg`);
                                        } else if (d && d.thumbnailUrl) {
                                           handleSetSrc(d.thumbnailUrl);
                                        }
                                      })
                                      .catch(() => {});
                                  });
                              } else {
                                handleSetSrc(`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`);
                              }
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#1ED760] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-[0_8px_15px_rgba(30,215,96,0.3)]">
                            {isActive && isPlaying ? (
                              <Pause className="w-6 h-6 text-black fill-black" />
                            ) : (
                              <Play className="w-6 h-6 text-black fill-black ml-1" />
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-[9px] font-bold text-white px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1">
                          {item.isPlaylist ? (
                            <>
                              <ListMusic className="w-3 h-3 text-[#1ED760]" />
                              <span>{item.trackCount ? `${item.trackCount} temas` : "PLAYLIST"}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 text-white fill-white" />
                              <span>VIDEO</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p
                          className="text-[12px] font-bold text-white leading-tight line-clamp-1 group-hover:text-[#1ED760] transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[10px] text-slate-400 font-medium truncate flex-1 flex items-center gap-1">
                            {item.isPlaylist ? (
                              <>
                                <span>{item.artist || "YouTube Music"}</span>
                                {Boolean(item.trackCount || item.tracks?.length) && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#1ED760]/90 font-semibold">{item.trackCount || item.tracks?.length} canciones</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span>{item.artist || "YouTube"}</span>
                            )}
                          </p>
                          {isAdmin && (
                            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromoteTarget({
                                    id: item.id || item.docId || item.url,
                                    title: item.title,
                                    thumbnail: getItemImage(item),
                                    artist: item.artist,
                                    description: item.description,
                                  });
                                }}
                                className="text-[#1ED760]/80 hover:text-[#1ED760] p-2 sm:p-1 rounded-md bg-black/40 sm:bg-transparent border border-[#1ED760]/20 sm:border-transparent transition-all"
                                title="Promocionar como destacada 🔥"
                              >
                                <Sparkles className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setTargetSectionId(section.id);
                                  setMoveTarget({
                                    docId: item.docId,
                                    itemId: item.id || item.url || item.title || `index-${songIdx}`,
                                    title: item.title,
                                    thumbnail: getItemImage(item),
                                    currentSectionId: section.id,
                                    url: item.url,
                                    isPlaylist: item.isPlaylist,
                                    artist: item.artist,
                                    trackCount: item.trackCount || item.tracks?.length,
                                    description: item.description,
                                  });
                                }}
                                className="text-amber-400/80 hover:text-amber-400 p-2 sm:p-1 rounded-md bg-black/40 sm:bg-transparent border border-amber-400/20 sm:border-transparent transition-all"
                                title="Mover a otra categoría 📁"
                              >
                                <FolderOutput className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (item.docId) {
                                    setItemToDelete({ docId: item.docId });
                                  } else {
                                    setItemToDelete({
                                      sectionId: section.id,
                                      itemId: item.id || item.url || item.title || `index-${songIdx}`,
                                    });
                                  }
                                }}
                                className="text-red-500/70 hover:text-red-500 p-2 sm:p-1 rounded-md bg-black/40 sm:bg-transparent border border-red-500/20 sm:border-transparent transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {!expandedSections[section.id] && section.data?.length > 12 && (
                <div 
                  onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: true }))}
                  className="snap-start shrink-0 w-[130px] sm:w-36 group cursor-pointer relative flex flex-col justify-center items-center opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#111113] border border-white/5 relative mb-2.5 flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
                  </div>
                  <p className="text-[12px] font-bold text-white leading-tight">
                    Ver más
                  </p>
                </div>
              )}
            </Carousel>
          </section>
        ))}

        {/* MOVE PLAYLIST CATEGORY MODAL */}
        {moveTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm sm:text-base">
                <FolderOutput className="w-5 h-5 text-amber-400" />
                Mover Playlist de Categoría
              </h3>

              <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10 mb-4">
                <img
                  src={moveTarget.thumbnail || DEFAULT_MUSIC_COVER}
                  alt={moveTarget.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{moveTarget.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {moveTarget.artist || "Playlist de YouTube Music"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Categoría de destino:
                </label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                >
                  {sortedLayout.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.id === moveTarget.currentSectionId ? "(Actual)" : ""}
                    </option>
                  ))}
                  <option value="CREATE_NEW">+ Crear nueva categoría...</option>
                </select>
              </div>

              {targetSectionId === "CREATE_NEW" && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-amber-400 mb-1.5 block">
                    Nombre de la nueva categoría:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Electro Gym, Perreo RKT..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-amber-400/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => {
                    setMoveTarget(null);
                    setNewCategoryName("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  disabled={isMoving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMoveCategory}
                  disabled={
                    isMoving ||
                    (targetSectionId === "CREATE_NEW" && !newCategoryName.trim())
                  }
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold rounded-full disabled:opacity-50 flex items-center gap-2 hover:brightness-110 transition-all shadow-md cursor-pointer"
                >
                  {isMoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirmar Mover"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTE PLAYLIST MODAL */}
        {promoteTarget && (
          <PromotePlaylistModal
            isOpen={Boolean(promoteTarget)}
            playlist={promoteTarget}
            onClose={() => setPromoteTarget(null)}
            onSuccess={() => showNotification("🔥 Playlist promocionada a todos los usuarios")}
          />
        )}
      </div>
    );
  },
);
