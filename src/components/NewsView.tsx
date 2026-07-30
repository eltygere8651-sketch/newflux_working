import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Trash2,
  Clock,
  Sparkles,
  Rocket,
  MonitorPlay,
  Users,
  Star,
  ArrowLeft,
  Pencil,
  Plus,
  X,
  Send,
  UploadCloud,
  Loader2
} from "lucide-react";
import { COMPILED_UPDATES, Announcement } from "./NotificationsModal";

interface NewsViewProps {
  isAdmin: boolean;
  onClose?: () => void;
}

export type NewsTabType = "updates" | "guides" | "community" | "featured";

// Compiled extra fallback items to guarantee rich content for all 4 submenus
const COMPILED_COMMUNITY: Announcement[] = [
  {
    id: "community-v1",
    title: "📢 Próximas funciones en desarrollo y participación activa",
    category: "comunidad",
    createdAt: new Date("2026-07-28T12:00:00Z"),
    content: "Estamos trabajando en la integración de nuevas frecuencias de radio personalizadas y optimización multiclave. Tu participación es fundamental: únete a la comunidad de Telegram y comparte vuestras sugerencias para seguir creciendo."
  },
  {
    id: "community-v2",
    title: "🎉 Comunicado Oficial: ¡Superamos las 10,000 escuchas en Flux Radio!",
    category: "comunidad",
    createdAt: new Date("2026-07-20T10:00:00Z"),
    content: "Agradecemos enormemente a todos los oyentes por formar parte de la familia Flux Music. Gracias a vuestro feedback diario hemos perfeccionado los algoritmos de mezcla y reducido el tiempo de carga a nivel récord."
  }
];

const COMPILED_FEATURED: Announcement[] = [
  {
    id: "featured-v1",
    title: "⭐ Lanzamiento Destacado: Modo Karaoke ECO e Inmersión Total",
    category: "destacado",
    createdAt: new Date("2026-07-29T10:00:00Z"),
    content: "Descubre la experiencia definitiva con el Modo Karaoke ECO, diseñado para reproducir letras en tiempo real a pantalla completa con efectos de eco y sin consumir batería extra."
  },
  {
    id: "featured-v2",
    title: "🔥 Selección Especial: Playlists Recomendadas & Radio Inteligente",
    category: "destacado",
    createdAt: new Date("2026-07-25T14:00:00Z"),
    content: "Explora las listas recomendadas más escuchadas de la semana y disfruta de la frecuencia de radio ininterrumpida curada para ofrecer máxima fidelidad sonora."
  }
];

const COMPILED_GUIDES: Announcement[] = [
  {
    id: "guide-v1",
    title: "🎥 Paso a paso: Cómo sacar el máximo partido al Ecualizador y Karaoke",
    category: "guia",
    createdAt: new Date("2026-07-26T16:00:00Z"),
    content: "1. Toca en el botón de ecualizador para ajustar graves y presencia vocal.\n2. Inicia cualquier canción y presiona el icono de Karaoke para ver las letras dinámicas.\n3. Activa los efectos de eco nativos para cantar en tiempo real."
  },
  {
    id: "guide-v2",
    title: "🎥 Guía rápida: Crear playlists personalizadas y reordenar tu biblioteca",
    category: "guia",
    createdAt: new Date("2026-07-22T11:00:00Z"),
    content: "Aprende a guardar tus canciones favoritas en colecciones propias, fijar listas de YouTube Music y personalizar el orden de las secciones en el Explorador."
  }
];

// Configuration dictionary for the 4 submenus
const SUBMENU_CONFIG = {
  updates: {
    id: "updates" as NewsTabType,
    title: "Actualizaciones",
    shortTitle: "Actualizaciones",
    icon: Rocket,
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    description: "Descubre las nuevas funciones, mejoras, optimizaciones y correcciones que llegan a Flux Music en cada actualización.",
    colorAccent: "from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30",
    iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  },
  guides: {
    id: "guides" as NewsTabType,
    title: "Guías & Videos",
    shortTitle: "Guías",
    icon: MonitorPlay,
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
    description: "Aprende a sacar el máximo partido a Flux Music con tutoriales, consejos y vídeos explicativos paso a paso.",
    colorAccent: "from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-500/30",
    iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  },
  community: {
    id: "community" as NewsTabType,
    title: "Comunidad",
    shortTitle: "Comunidad",
    icon: Users,
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.2)]",
    description: "Mantente informado sobre anuncios importantes, próximas funciones y participa en el crecimiento de Flux Music.",
    colorAccent: "from-fuchsia-500/15 via-fuchsia-500/5 to-transparent border-fuchsia-500/30",
    iconBg: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40",
  },
  featured: {
    id: "featured" as NewsTabType,
    title: "Destacados",
    shortTitle: "Destacados",
    icon: Star,
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    description: "Explora las novedades más importantes, playlists recomendadas y el contenido que no te puedes perder.",
    colorAccent: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30",
    iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
};

export const NewsView: React.FC<NewsViewProps> = ({ isAdmin, onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NewsTabType>("updates");

  // Admin Create & Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("actualizacion");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Por favor configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tus variables de entorno para usar esta función.");
      return;
    }

    const isVideo = file.type.startsWith('video/');
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setFormVideoUrl(data.secure_url);
      } else {
        throw new Error(data.error?.message || "Error al subir el archivo");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Error al subir a Cloudinary: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(40));
      import("firebase/firestore").then(({ onSnapshot }) => {
        if (!isMounted) return;
        unsubscribe = onSnapshot(q, (snap) => {
          const firebaseList: Announcement[] = [];
          const deletedIds = new Set<string>();
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.deleted) {
              deletedIds.add(docSnap.id);
            } else {
              firebaseList.push({
                id: docSnap.id,
                title: data.title || "",
                content: data.content || "",
                videoUrl: data.videoUrl || "",
                category: data.category || "noticia",
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                active: data.active !== false,
              });
            }
          });

          const allCombined = [
            ...firebaseList,
            ...COMPILED_UPDATES,
            ...COMPILED_COMMUNITY,
            ...COMPILED_FEATURED,
            ...COMPILED_GUIDES,
          ].filter(item => !deletedIds.has(item.id));

          // Deduplicate by ID
          const uniqueMap = new Map<string, Announcement>();
          allCombined.forEach((item) => uniqueMap.set(item.id, item));

          const merged = Array.from(uniqueMap.values()).sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          );
          setAnnouncements(merged);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching news realtime:", err);
          setAnnouncements([
            ...COMPILED_UPDATES,
            ...COMPILED_COMMUNITY,
            ...COMPILED_FEATURED,
            ...COMPILED_GUIDES,
          ]);
          setLoading(false);
        });
      });
    } catch (err) {
      console.error("Error fetching news:", err);
      setAnnouncements([
        ...COMPILED_UPDATES,
        ...COMPILED_COMMUNITY,
        ...COMPILED_FEATURED,
        ...COMPILED_GUIDES,
      ]);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle("");
    let defaultCat = "actualizacion";
    if (activeTab === "guides") defaultCat = "guia";
    if (activeTab === "community") defaultCat = "comunidad";
    if (activeTab === "featured") defaultCat = "destacado";
    setFormCategory(defaultCat);
    setFormVideoUrl("");
    setFormContent("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category || "actualizacion");
    setFormVideoUrl(item.videoUrl || "");
    setFormContent(item.content);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      alert("Por favor completa el título y el contenido.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        const docId = editingItem.id;
        const isBuiltIn = docId.startsWith("update-v") || docId.startsWith("community-") || docId.startsWith("featured-") || docId.startsWith("guide-");
        
        if (!isBuiltIn) {
          await updateDoc(doc(db, "announcements", docId), {
            title: formTitle.trim(),
            category: formCategory,
            videoUrl: formVideoUrl.trim(),
            content: formContent.trim(),
          });
        }
      } else {
        const newId = "ann_" + Math.random().toString(36).substring(2, 11);
        const newAnnData = {
          title: formTitle.trim(),
          category: formCategory,
          videoUrl: formVideoUrl.trim(),
          content: formContent.trim(),
          createdAt: new Date(),
          active: true,
        };
        await setDoc(doc(db, "announcements", newId), newAnnData);
      }
      setIsModalOpen(false);
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      alert("Error al guardar: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    
    setDeleteConfirmId(null);
    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (isBuiltIn) {
        await setDoc(doc(db, "announcements", id), { deleted: true, createdAt: new Date() });
      } else {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      console.error("No se pudo eliminar: " + err);
    }
  };
  
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(null);
  };

  const getCategoryBadge = (category: string) => {
    const c = category?.toLowerCase();
    switch (c) {
      case "urgente":
      case "destacado":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "mantenimiento":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "actualizacion":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "guia":
      case "tutorial":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "comunidad":
      case "anuncio":
        return "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  // Strictly filter items according to the active tab
  const filteredItems = announcements.filter((item) => {
    const cat = (item.category || "").toLowerCase();
    if (activeTab === "guides") {
      return Boolean(item.videoUrl || cat === "guia" || cat === "tutorial" || item.id.startsWith("guide-"));
    }
    if (activeTab === "community") {
      return cat === "comunidad" || cat === "anuncio" || cat === "comunicado" || item.id.startsWith("community-");
    }
    if (activeTab === "featured") {
      return cat === "urgente" || cat === "destacado" || item.id.startsWith("featured-") || item.id === "update-v1.9.0";
    }
    // Default "updates"
    return (
      cat === "actualizacion" ||
      cat === "mantenimiento" ||
      item.id.startsWith("update-v") ||
      (!item.videoUrl && cat !== "guia" && cat !== "comunidad" && cat !== "destacado" && cat !== "urgente")
    );
  });

  const activeConfig = SUBMENU_CONFIG[activeTab];
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="w-full h-full flex flex-col bg-[#070709] text-white overflow-hidden relative font-sans">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.1),_rgba(6,182,212,0.04),_transparent_70%)] pointer-events-none z-0" />

      {/* TOP SLEEK HEADER */}
      <header className="sticky top-0 z-50 px-2 sm:px-8 py-3 bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between gap-1 sm:gap-4 shrink-0 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        {/* Left: Premium Exit Button matching Flux styling */}
        {onClose ? (
          <button
            onClick={onClose}
            className="group flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-fuchsia-500/15 to-cyan-500/15 hover:from-amber-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30 active:scale-95 border border-white/20 backdrop-blur-xl text-white font-black text-xs shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer shrink-0"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline uppercase tracking-widest text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300">
              Volver
            </span>
          </button>
        ) : (
          <div className="w-8 sm:w-24 shrink-0" />
        )}

        {/* Center: Title emblem */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md min-w-0">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 animate-pulse shrink-0" />
          <h1 className="text-[10px] sm:text-sm font-black uppercase tracking-wider sm:tracking-[0.2em] text-white truncate">
            Novedades
          </h1>
        </div>

        {/* Right side live status & Admin action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              <span className="hidden md:inline">Publicar Novedad</span>
              <span className="inline md:hidden">Publicar</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden lg:inline">Flux Center</span>
          </div>
          <div className="flex sm:hidden items-center justify-center bg-white/5 w-6 h-6 rounded-full border border-white/10 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* ISOLATED 4 SUBMENUS BAR */}
      <div className="px-3 sm:px-8 py-2.5 sm:py-3 bg-[#0a0b0e] border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-20">
        <div className="grid grid-cols-2 sm:flex bg-[#12131a] p-1.5 sm:p-1 rounded-2xl sm:rounded-full border border-white/10 shrink-0 gap-1.5 sm:gap-1 w-full sm:w-auto">
          {Object.values(SUBMENU_CONFIG).map((sub) => {
            const IconComp = sub.icon;
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? sub.badgeColor
                    : "text-slate-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">{sub.shortTitle}</span>
                <span className="hidden sm:inline">{sub.title}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block shrink-0">
          {filteredItems.length} {filteredItems.length === 1 ? "publicación" : "publicaciones"}
        </span>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto premium-scrollbar relative z-10 px-4 sm:px-8 pt-5 pb-20 max-w-[1400px] mx-auto w-full">
        {/* ACTIVE SUBMENU DESCRIPTION BANNER */}
        <div
          className={`mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r ${activeConfig.colorAccent} border backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl transition-all duration-300`}
        >
          <div className={`p-3 rounded-xl border ${activeConfig.iconBg} shrink-0`}>
            <ActiveIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
              {activeConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {activeConfig.description}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Cargando contenido...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white/[0.02] rounded-2xl border border-white/5 p-6 text-center">
            <Sparkles className="w-10 h-10 opacity-30 text-amber-400" />
            <p className="font-bold text-sm text-slate-300">
              Sin publicaciones en esta sección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className={`group bg-[#111218] rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/40 transition-all duration-300 flex flex-col shadow-xl relative ${
                  idx === 0 && item.videoUrl ? "md:col-span-2 lg:col-span-3 lg:flex-row" : ""
                }`}
              >
                {/* Video Player Section if present */}
                {item.videoUrl && (
                  <div
                    className={`relative bg-black ${
                      idx === 0 ? "lg:w-[55%] aspect-video lg:aspect-auto shrink-0" : "w-full aspect-video shrink-0"
                    }`}
                  >
                    {item.videoUrl.includes("/image/") || item.videoUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img
                        src={item.videoUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.videoUrl}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Content Body */}
                <div className="p-5 flex flex-col justify-between gap-4 flex-1">
                  <div className="flex flex-col gap-3">
                    {/* Category & Date */}
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`px-3 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Intl.DateTimeFormat("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }).format(item.createdAt)}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                            <button
                              onClick={(e) => handleOpenEdit(item, e)}
                              className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-full transition-all cursor-pointer"
                              title="Editar Novedad"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className={`p-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                                deleteConfirmId === item.id
                                  ? "bg-rose-500 text-white hover:bg-rose-600 px-2"
                                  : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                              }`}
                              title={deleteConfirmId === item.id ? "Confirmar eliminar" : "Eliminar"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deleteConfirmId === item.id && <span className="text-[9px] font-bold uppercase tracking-wider">¿Borrar?</span>}
                            </button>
                            {deleteConfirmId === item.id && (
                              <button
                                onClick={handleCancelDelete}
                                className="p-1 px-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                                title="Cancelar"
                              >
                                X
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-black text-base sm:text-lg leading-tight tracking-tight group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>

                    {/* Content text */}
                    <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADMIN EDIT / CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-white/15 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {editingItem ? "Editar Publicación" : "Nueva Publicación de Novedad"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Submenu / Category selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Submenú de Destino (Categoría)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "actualizacion", label: "Actualizaciones", icon: Rocket, badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
                  { id: "guia", label: "Guías & Videos", icon: MonitorPlay, badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
                  { id: "comunidad", label: "Comunidad", icon: Users, badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
                  { id: "destacado", label: "Destacados", icon: Star, badge: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
                ].map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = formCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${cat.badge} shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-1 ring-white/30`
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <CatIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Título del Comunicado
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Nueva actualización v2.5 o Guía rápida de uso"
                className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/50 transition-all font-medium"
              />
            </div>

            {/* Media input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Video o Imagen (Cloudinary / URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="Pegar URL o subir archivo..."
                  className="flex-1 px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 transition-all font-medium"
                />
                <input
                  type="file"
                  id="cloudinary-upload-news"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("cloudinary-upload-news")?.click()}
                  disabled={isUploading}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
                  title="Subir a Cloudinary"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <UploadCloud className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>
              {isUploading && (
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-cyan-400 animate-pulse w-full"></div>
                </div>
              )}
            </div>

            {/* Content input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Contenido / Detalles
              </label>
              <textarea
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Escribe los detalles de la publicación..."
                className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-fuchsia-400/50 transition-all font-medium resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-fuchsia-500 to-cyan-500 hover:opacity-90 active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSaving ? "Guardando..." : "Guardar Publicación"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
