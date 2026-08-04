import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Eye, EyeOff, ChevronUp, ChevronDown, Trash2,
  Clock,
  Sparkles,
  Rocket,
  MonitorPlay,
  Users,
  ArrowLeft,
  Pencil,
  Plus,
  X,
  Send,
  UploadCloud,
  Loader2,
  Share2,
  Video,
  CheckCircle2
} from "lucide-react";
import { COMPILED_UPDATES, Announcement } from "./NotificationsModal";

interface NewsViewProps {
  isAdmin: boolean;
  onClose?: () => void;
}

export type NewsTabType = "updates" | "guides" | "community" | "onboarding" | null;

// Compiled extra fallback items to guarantee rich content for all submenus
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

// Configuration dictionary for submenus
const SUBMENU_CONFIG = {
  guides: {
    id: "guides" as NewsTabType,
    title: "Guías & Uso",
    shortTitle: "Guías",
    icon: MonitorPlay,
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
    description: "Aprende a sacar el máximo partido a Flux Music con tutoriales, consejos y guías de uso paso a paso.",
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
  onboarding: {
    id: "onboarding" as NewsTabType,
    title: "Onboarding",
    shortTitle: "Onboarding",
    icon: Sparkles,
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    description: "Gestión del Centro de Bienvenida. Publica el onboarding para todos los usuarios y organiza las tarjetas modulares.",
    colorAccent: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  }
};


export const NewsView: React.FC<NewsViewProps> = ({ isAdmin, onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NewsTabType>(null);

  // Onboarding Publish Target & Versions
  const [publishTargetOS, setPublishTargetOS] = useState<"all" | "android" | "ios">("all");
  const [onboardingVersions, setOnboardingVersions] = useState<{ global: number; android: number; ios: number }>({ global: 1, android: 1, ios: 1 });
  const [onboardingVideoAndroid, setOnboardingVideoAndroid] = useState<string>("");
  const [onboardingVideoIos, setOnboardingVideoIos] = useState<string>("");
  const [isSavingOnboardingVideos, setIsSavingOnboardingVideos] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === "onboarding" && isAdmin) {
      import("firebase/firestore").then(({ doc, getDoc }) => {
        getDoc(doc(db, "config", "onboarding")).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const a = typeof data.version_android === 'number' ? data.version_android : 1;
            const i = typeof data.version_ios === 'number' ? data.version_ios : 1;
            const g = Math.max(a, i);
            setOnboardingVersions({ global: g, android: a, ios: i });
            if (data.videoUrl_android) setOnboardingVideoAndroid(data.videoUrl_android);
            if (data.videoUrl_ios) setOnboardingVideoIos(data.videoUrl_ios);
          }
        }).catch(err => console.error("Error fetching onboarding config:", err));
      });
    }
  }, [activeTab, isAdmin]);

  // Admin Create & Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("actualizacion");
  const [formTargetOS, setFormTargetOS] = useState<"all" | "ios" | "android">("all");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formActionText, setFormActionText] = useState("");
  const [formActionUrl, setFormActionUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const uploadToCloudinary = async (file: File, onSuccess: (url: string) => void) => {
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
        onSuccess(data.secure_url);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file, (url) => setFormVideoUrl(url));
    }
  };

  const handleSaveOnboardingVideos = async () => {
    setIsSavingOnboardingVideos(true);
    try {
      const configRef = doc(db, "config", "onboarding");
      await setDoc(configRef, {
        videoUrl_android: onboardingVideoAndroid,
        videoUrl_ios: onboardingVideoIos,
      }, { merge: true });
      alert("¡Videos guía para Android y iOS guardados exitosamente!");
    } catch (e: any) {
      alert("Error al guardar los videos guía: " + e.message);
    } finally {
      setIsSavingOnboardingVideos(false);
    }
  };

  // Admin Share Card to Novedades State
  const [shareItem, setShareItem] = useState<Announcement | null>(null);
  const [shareTargetCategory, setShareTargetCategory] = useState<string>("guia");
  const [isSharing, setIsSharing] = useState(false);

  const handleOpenShareModal = (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShareItem(item);
    setShareTargetCategory("guia");
  };

  const handleConfirmShare = async () => {
    if (!shareItem) return;
    setIsSharing(true);
    try {
      const newId = "ann_" + Math.random().toString(36).substring(2, 11);
      const newAnnData = {
        title: shareItem.title,
        category: shareTargetCategory,
        videoUrl: shareItem.videoUrl || "",
        content: shareItem.content,
        actionText: shareItem.actionText || "",
        actionUrl: shareItem.actionUrl || "",
        targetOS: "all",
        createdAt: new Date(),
        active: true,
      };
      await setDoc(doc(db, "announcements", newId), newAnnData);

      let catLabel = "Actualizaciones";
      if (shareTargetCategory === "guia") catLabel = "Guías & Uso";
      if (shareTargetCategory === "comunidad") catLabel = "Comunidad";

      alert(`¡Tarjeta compartida exitosamente en la pestaña "${catLabel}"!`);
      setShareItem(null);
    } catch (err) {
      alert("Error al compartir la tarjeta: " + err);
    } finally {
      setIsSharing(false);
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
                actionText: data.actionText || "",
                actionUrl: data.actionUrl || "",
                targetOS: data.targetOS || "all",
              });
            }
          });

          const allCombined = [
            ...firebaseList,
            ...COMPILED_UPDATES,
            ...COMPILED_COMMUNITY,
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
    setFormCategory(defaultCat);
    setFormVideoUrl("");
    setFormContent("");
    setFormActionText("");
    setFormActionUrl("");
    setFormTargetOS("all");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category || "actualizacion");
    setFormTargetOS(item.targetOS || "all");
    setFormVideoUrl(item.videoUrl || "");
    setFormContent(item.content);
    setFormActionText(item.actionText || "");
    setFormActionUrl(item.actionUrl || "");
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
        actionText: formActionText.trim(),
        actionUrl: formActionUrl.trim(),
            targetOS: formCategory === "onboarding" ? formTargetOS : "all",
          });
        }
      } else {
        const newId = "ann_" + Math.random().toString(36).substring(2, 11);
        const newAnnData = {
          title: formTitle.trim(),
          category: formCategory,
          videoUrl: formVideoUrl.trim(),
          content: formContent.trim(),
          actionText: formActionText.trim(),
          actionUrl: formActionUrl.trim(),
          targetOS: formCategory === "onboarding" ? formTargetOS : "all",
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
  
  const handleToggleActive = async (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const newActiveState = item.active === false ? true : false;
      await updateDoc(doc(db, "announcements", item.id), { active: newActiveState });
      setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, active: newActiveState } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveOrder = async (item: Announcement, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeTab !== "onboarding") return;
    const items = filteredItems;
    const index = items.findIndex(a => a.id === item.id);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const targetItem = items[targetIndex];
    
    try {
      const itemOrder = item.order ?? index;
      const targetOrder = targetItem.order ?? targetIndex;
      
      await updateDoc(doc(db, "announcements", item.id), { order: targetOrder });
      await updateDoc(doc(db, "announcements", targetItem.id), { order: itemOrder });
      
      setAnnouncements(prev => prev.map(a => {
        if (a.id === item.id) return { ...a, order: targetOrder };
        if (a.id === targetItem.id) return { ...a, order: itemOrder };
        return a;
      }));
    } catch(err) {
      console.error(err);
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
    if (!activeTab) return false;
    const cat = (item.category || "").toLowerCase();
    if (activeTab === "guides") {
      return Boolean(item.videoUrl || cat === "guia" || cat === "tutorial" || item.id.startsWith("guide-"));
    }
    if (activeTab === "community") {
      return cat === "comunidad" || cat === "anuncio" || cat === "comunicado" || item.id.startsWith("community-");
    }
    if (activeTab === "onboarding") {
      return cat === "onboarding";
    }
    // Default "updates"
    return (
      cat === "actualizacion" ||
      cat === "mantenimiento" ||
      item.id.startsWith("update-v") ||
      (!item.videoUrl && cat !== "guia" && cat !== "comunidad")
    );
  }).sort((a,b) => {
    if (a.category === 'onboarding' && b.category === 'onboarding') {
      return (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt;
    }
    return (a.order || 0) - (b.order || 0) || b.createdAt - a.createdAt;
  });

  const activeConfig = activeTab ? SUBMENU_CONFIG[activeTab] : null;
  const ActiveIcon = activeConfig?.icon;

  return (
    <div className="w-full h-full flex flex-col bg-[#070709] text-white overflow-hidden relative font-sans">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.1),_rgba(6,182,212,0.04),_transparent_70%)] pointer-events-none z-0" />

      {/* TOP SLEEK HEADER WITH IOS SAFE AREA INSET */}
      <header 
        className="sticky top-0 z-50 px-3 sm:px-8 py-3 bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-[0_4px_25px_rgba(0,0,0,0.8)]"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {/* Left: Premium Exit Button matching Flux styling */}
        {onClose ? (
          <button
            onClick={onClose}
            className="group flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-fuchsia-500/15 to-cyan-500/15 hover:from-amber-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30 active:scale-95 border border-white/20 backdrop-blur-xl text-white font-black text-xs shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer shrink-0"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform shrink-0" />
            <span className="hidden sm:inline uppercase tracking-widest text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300">
              Volver
            </span>
          </button>
        ) : (
          <div className="w-8 sm:w-24 shrink-0" />
        )}

        {/* Center: Title emblem */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <h1 className="text-[11px] sm:text-sm font-black uppercase tracking-wider sm:tracking-[0.2em] text-white truncate">
            Novedades
          </h1>
        </div>

        {/* Right side live status & Admin action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-[10px] sm:text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              <span className="hidden sm:inline">Publicar Novedad</span>
              <span className="inline sm:hidden">Publicar</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden lg:inline">Flux Center</span>
          </div>
          <div className="flex sm:hidden items-center justify-center bg-white/5 w-7 h-7 rounded-full border border-white/10 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* ISOLATED SLEEK SUBMENUS TAB BAR FOR MOBILE & DESKTOP */}
      <div className="px-3 sm:px-8 py-2 sm:py-3 bg-[#0a0b0e] border-b border-white/5 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-20 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar bg-[#12131a] p-1.5 sm:p-1 rounded-2xl sm:rounded-full border border-white/10 shrink-0 gap-1.5 sm:gap-1 w-full sm:w-auto touch-pan-x">
          {Object.values(SUBMENU_CONFIG).filter(sub => isAdmin || sub.id !== "onboarding").map((sub) => {
            const IconComp = sub.icon;
            const isActive = activeTab === sub.id;
            
            let count = 0;
            if (sub.id === "updates") count = announcements.filter(a => a.category === "actualizacion" || a.id.startsWith("update-")).length;
            else if (sub.id === "guides") count = announcements.filter(a => a.category === "guia" || a.id.startsWith("guide-")).length;
            else if (sub.id === "community") count = announcements.filter(a => a.category === "comunidad" || a.id.startsWith("community-")).length;
            else if (sub.id === "onboarding") count = announcements.filter(a => a.category === "onboarding").length;

            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? sub.badgeColor
                    : "text-slate-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                <span>{sub.title}</span>
                {count > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0a0b0e]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block shrink-0">
          {activeTab ? `${filteredItems.length} ${filteredItems.length === 1 ? "publicación" : "publicaciones"}` : ""}
        </span>
      </div>

      {/* SCROLLABLE CONTENT WITH IOS SAFE BOTTOM INSET */}
      <div 
        className="flex-1 overflow-y-auto premium-scrollbar relative z-10 px-4 sm:px-8 pt-5 max-w-[1400px] mx-auto w-full"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {!activeTab ? (
          <div className="w-full h-full flex flex-col items-center pt-8 pb-16 px-4">
            <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-white mb-4 text-center">
              Centro de Novedades
            </h2>
            <p className="text-slate-400 font-medium text-center max-w-lg mb-12 text-sm sm:text-base leading-relaxed">
              Explora las guías de uso, mantente al día con la comunidad y descubre las últimas actualizaciones de Flux Music. Selecciona una categoría para comenzar.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-5xl">
              {Object.values(SUBMENU_CONFIG).filter(sub => isAdmin || sub.id !== "onboarding").map((sub) => {
                const IconComp = sub.icon;
                
                let count = 0;
                if (sub.id === "updates") count = announcements.filter(a => a.category === "actualizacion" || a.id.startsWith("update-")).length;
                else if (sub.id === "guides") count = announcements.filter(a => a.category === "guia" || a.id.startsWith("guide-")).length;
                else if (sub.id === "community") count = announcements.filter(a => a.category === "comunidad" || a.id.startsWith("community-")).length;
                else if (sub.id === "onboarding") count = announcements.filter(a => a.category === "onboarding").length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id)}
                    className="bg-[#111218] border border-white/5 hover:border-white/20 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${sub.colorAccent} opacity-40 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex items-start justify-between">
                      <div className={`p-4 rounded-2xl border ${sub.iconBg} shadow-lg transition-transform group-hover:scale-110`}>
                        <IconComp className="w-7 h-7" />
                      </div>
                      {count > 0 && (
                        <div className="bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-inner">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-black tracking-wider text-white uppercase">{count} {count === 1 ? 'nuevo' : 'nuevos'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-black uppercase tracking-wider text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">{sub.title}</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">{sub.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* ACTIVE SUBMENU DESCRIPTION BANNER */}
            <div
              className={`mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r ${activeConfig?.colorAccent} border backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl transition-all duration-300`}
            >
              <div className={`p-3 rounded-xl border ${activeConfig?.iconBg} shrink-0`}>
                {ActiveIcon && <ActiveIcon className="w-6 h-6" />}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
                  {activeConfig?.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {activeConfig?.description}
                </p>
              </div>
            </div>
        {activeTab === "onboarding" && isAdmin && (
          <>
            <div className="mb-6 p-5 rounded-2xl bg-[#08090d] border border-emerald-500/30 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Control de Versiones y Despliegue
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    🤖 Android: v{onboardingVersions.android}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    📱 iOS: v{onboardingVersions.ios}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Tienes <strong className="text-white">{filteredItems.length}</strong> tarjetas configuradas. Elige el sistema operativo destino para publicar únicamente a ese sistema sin afectar al otro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full xl:w-auto">
              {/* Preview & Share buttons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("preview-onboarding", { detail: { targetOS: "android", forceIOS: false } }));
                    }} 
                    className="px-3 py-1.5 text-slate-200 text-xs font-bold uppercase tracking-wider hover:text-white transition-all cursor-pointer"
                    title="Probar vista previa en Android"
                  >
                    🤖 Previa Android
                  </button>
                  <button
                    onClick={(e) => {
                      handleOpenShareModal({
                        id: "preview_android_guide",
                        title: "🤖 Guía de inicio para Android - Experiencia en Brave",
                        category: "guia",
                        content: "Para disfrutar de la experiencia completa de Flux Music en Android, instala Flux desde el navegador Brave. Disfruta de reproducción en segundo plano, pantalla bloqueada y respuesta fluida como app nativa.",
                        videoUrl: onboardingVideoAndroid,
                        createdAt: new Date(),
                        active: true
                      }, e);
                    }}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
                    title="Compartir previa Android en Novedades"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("preview-onboarding", { detail: { targetOS: "ios", forceIOS: true } }));
                    }} 
                    className="px-3 py-1.5 text-slate-200 text-xs font-bold uppercase tracking-wider hover:text-white transition-all cursor-pointer"
                    title="Probar vista previa en iOS"
                  >
                    📱 Previa iOS
                  </button>
                  <button
                    onClick={(e) => {
                      handleOpenShareModal({
                        id: "preview_ios_guide",
                        title: "📱 Guía de inicio para iOS - Experiencia en Brave",
                        category: "guia",
                        content: "Flux Music funciona vía web. Usa el navegador Brave para habilitar la experiencia completa y el audio en segundo plano. Escucha con la pantalla bloqueada sin cortes.",
                        videoUrl: onboardingVideoIos,
                        createdAt: new Date(),
                        active: true
                      }, e);
                    }}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
                    title="Compartir previa iOS en Novedades"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Target OS Selector */}
              <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPublishTargetOS("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    publishTargetOS === "all"
                      ? "bg-emerald-500 text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Ambos
                </button>
                <button
                  type="button"
                  onClick={() => setPublishTargetOS("android")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    publishTargetOS === "android"
                      ? "bg-amber-500 text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🤖 Android
                </button>
                <button
                  type="button"
                  onClick={() => setPublishTargetOS("ios")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    publishTargetOS === "ios"
                      ? "bg-purple-500 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📱 iOS
                </button>
              </div>

              {/* Publish Action Button */}
              <button 
                onClick={async () => {
                  try {
                    const configRef = doc(db, "config", "onboarding");
                    const docSnap = await import("firebase/firestore").then(m => m.getDoc(configRef));
                    let a = 1, i = 1;
                    if (docSnap.exists()) {
                      const data = docSnap.data();
                      a = typeof data.version_android === 'number' ? data.version_android : 1;
                      i = typeof data.version_ios === 'number' ? data.version_ios : 1;
                    }

                    let newA = a;
                    let newI = i;

                    if (publishTargetOS === "all") {
                      newA = a + 1;
                      newI = i + 1;
                    } else if (publishTargetOS === "android") {
                      newA = a + 1;
                    } else if (publishTargetOS === "ios") {
                      newI = i + 1;
                    }

                    const newG = Math.max(newA, newI);

                    const payload = {
                      version: newG,
                      version_android: newA,
                      version_ios: newI,
                      updatedAt: new Date(),
                    };

                    const setDocFn = await import("firebase/firestore").then(m => m.setDoc);
                    await setDocFn(configRef, payload, { merge: true });

                    setOnboardingVersions({ global: newG, android: newA, ios: newI });

                    const targetLabel = publishTargetOS === "all" ? "Android e iOS" : publishTargetOS === "android" ? "Android" : "iOS";
                    alert(`¡Onboarding publicado correctamente para ${targetLabel}!\n\n• Versión Android: v${newA}\n• Versión iOS: v${newI}`);
                  } catch (e) {
                    console.error(e);
                    alert("Error al publicar el onboarding.");
                  }
                }} 
                className={`px-5 py-2.5 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg ${
                  publishTargetOS === "android"
                    ? "bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20"
                    : publishTargetOS === "ios"
                    ? "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                }`}
              >
                <Send className="w-4 h-4" />
                {publishTargetOS === "all" ? "Publicar para Todos" : publishTargetOS === "android" ? "Publicar para Android" : "Publicar para iOS"}
              </button>
            </div>
          </div>

          {/* SECCIÓN PARA SUBIR O INSERTAR VIDEOS GUÍA DE VISTAS PREVIAS */}
          <div className="mb-6 p-5 rounded-2xl bg-[#08090d] border border-cyan-500/30 flex flex-col gap-4 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400">
                  Videos Guía para Vistas Previas (Android / iOS)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveOnboardingVideos}
                disabled={isSavingOnboardingVideos || isUploading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
              >
                {isSavingOnboardingVideos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSavingOnboardingVideos ? "Guardando..." : "Guardar Videos Guía"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Android Video Guide */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    🤖 Video Guía para Android
                  </span>
                  {onboardingVideoAndroid && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cargado
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={onboardingVideoAndroid}
                  onChange={(e) => setOnboardingVideoAndroid(e.target.value)}
                  placeholder="URL del video en Cloudinary (https://...)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition-all border border-white/10">
                    <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Subir a Cloudinary</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadToCloudinary(file, (url) => setOnboardingVideoAndroid(url));
                      }}
                    />
                  </label>
                  {onboardingVideoAndroid && (
                    <button
                      type="button"
                      onClick={() => setOnboardingVideoAndroid("")}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* iOS Video Guide */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    📱 Video Guía para iOS
                  </span>
                  {onboardingVideoIos && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cargado
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={onboardingVideoIos}
                  onChange={(e) => setOnboardingVideoIos(e.target.value)}
                  placeholder="URL del video en Cloudinary (https://...)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition-all border border-white/10">
                    <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Subir a Cloudinary</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadToCloudinary(file, (url) => setOnboardingVideoIos(url));
                      }}
                    />
                  </label>
                  {onboardingVideoIos && (
                    <button
                      type="button"
                      onClick={() => setOnboardingVideoIos("")}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
        )}


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
                className={`group bg-[#111218] rounded-3xl overflow-hidden border ${item.active === false ? "border-rose-500/50 opacity-60 grayscale-[50%]" : "border-white/10"} hover:border-amber-400/40 transition-all duration-300 flex flex-col shadow-2xl relative ${
                  idx === 0 && item.videoUrl ? "md:col-span-2 lg:col-span-3" : ""
                }`}
              >
                {/* Content Body (Header) */}
                <div className="p-6 flex flex-col justify-between gap-5 flex-1">
                  <div className="flex flex-col gap-4">
                    {/* Category & Date */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getCategoryBadge(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                        {activeTab === "onboarding" && (
                          <span
                            className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                              item.targetOS === "ios"
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                : item.targetOS === "android"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            }`}
                          >
                            {item.targetOS === "ios" ? "📱 Solo iOS" : item.targetOS === "android" ? "🤖 Solo Android" : "🌐 Ambos"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Intl.DateTimeFormat("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }).format(item.createdAt)}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                            {activeTab === "onboarding" && (
                              <>
                                <button
                                  onClick={(e) => handleMoveOrder(item, 'up', e)}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleMoveOrder(item, 'down', e)}
                                  disabled={idx === filteredItems.length - 1}
                                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleActive(item, e)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-full transition-all cursor-pointer"
                                  title={item.active === false ? "Activar" : "Desactivar"}
                                >
                                  {item.active === false ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <div className="w-px h-3 bg-white/20 mx-1" />
                              </>
                            )}
                            <button
                              onClick={(e) => handleOpenShareModal(item, e)}
                              className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-full transition-all cursor-pointer"
                              title="Compartir a otra pestaña de Novedades"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
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

                    <div className="flex flex-col gap-2.5">
                      {/* Title */}
                      <h3 className="text-white font-black text-xl sm:text-2xl leading-tight tracking-tight group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>

                      {/* Content text */}
                      <p className="text-[13px] sm:text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Player Section if present */}
                {item.videoUrl && (
                  <div
                    className={`relative bg-black w-full shrink-0 border-t border-white/5 ${
                      idx === 0 ? "max-h-[600px]" : "aspect-video"
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
              </div>
            ))}
          </div>
        )}
        </>
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
                  { id: "guia", label: "Guías & Uso", icon: MonitorPlay, badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
                  { id: "onboarding", label: "Onboarding (Bienvenida)", icon: Sparkles, badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
                  { id: "comunidad", label: "Comunidad", icon: Users, badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
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

            {/* Action Button Inputs */}
            {formCategory === "onboarding" && (
              <>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Dispositivos Destino
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "Ambos" },
                      { id: "android", label: "Solo Android" },
                      { id: "ios", label: "Solo iOS" }
                    ].map(os => (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => setFormTargetOS(os.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          formTargetOS === os.id 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {os.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Texto del Botón (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formActionText}
                    onChange={(e) => setFormActionText(e.target.value)}
                    placeholder="Ej. Saber más"
                    className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    URL del Botón (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formActionUrl}
                    onChange={(e) => setFormActionUrl(e.target.value)}
                    placeholder="Ej. https://..."
                    className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/50 transition-all font-medium"
                  />
                </div>
              </div>
              </>
            )}
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

      {/* ADMIN SHARE CARD TO NOVEDADES MODAL */}
      {shareItem && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-white/15 rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Compartir Tarjeta a Novedades
                </h3>
              </div>
              <button
                onClick={() => setShareItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tarjeta a compartir:
              </span>
              <h4 className="text-xs font-black text-white">{shareItem.title}</h4>
              <p className="text-[11px] text-slate-300 line-clamp-2">{shareItem.content}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Elige la pestaña de destino en Novedades
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "actualizacion", label: "Actualizaciones", icon: Rocket, badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
                  { id: "guia", label: "Guías & Uso", icon: MonitorPlay, badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
                  { id: "comunidad", label: "Comunidad", icon: Users, badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
                ].map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = shareTargetCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setShareTargetCategory(cat.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${cat.badge} shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-1 ring-white/30`
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <CatIcon className="w-4 h-4 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShareItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSharing ? "Compartiendo..." : "Publicar en Novedades"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
