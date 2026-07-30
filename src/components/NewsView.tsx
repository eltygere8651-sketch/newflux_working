import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Trash2,
  Clock,
  Sparkles,
  Megaphone,
  MonitorPlay,
  ArrowLeft
} from "lucide-react";
import { COMPILED_UPDATES, Announcement } from "./NotificationsModal";

interface NewsViewProps {
  isAdmin: boolean;
  onClose?: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ isAdmin, onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"updates" | "guides">("updates");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(30));
        const snap = await getDocs(q);
        const firebaseList: Announcement[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          firebaseList.push({
            id: docSnap.id,
            title: data.title || "",
            content: data.content || "",
            videoUrl: data.videoUrl || "",
            category: data.category || "noticia",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            active: data.active !== false,
          });
        });

        const merged = [...firebaseList, ...COMPILED_UPDATES].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setAnnouncements(merged);
      } catch (err) {
        console.error("Error fetching news:", err);
        setAnnouncements(COMPILED_UPDATES);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      alert("No se pudo eliminar: " + err);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category?.toLowerCase()) {
      case "urgente":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "mantenimiento":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "actualizacion":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "guia":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30";
    }
  };

  // Strictly filter items according to the active tab
  const filteredItems = announcements.filter((item) => {
    if (activeTab === "guides") {
      // Must have videoUrl or category 'guia'
      return Boolean(item.videoUrl || item.category === "guia");
    } else {
      // Must NOT have videoUrl or category 'guia'
      return !item.videoUrl && item.category !== "guia";
    }
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#070709] text-white overflow-hidden relative font-sans">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.1),_rgba(6,182,212,0.04),_transparent_70%)] pointer-events-none z-0" />

      {/* TOP SLEEK HEADER */}
      <header className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between gap-4 shrink-0 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        {/* Left: Premium Exit Button matching Flux styling */}
        {onClose ? (
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-fuchsia-500/15 to-cyan-500/15 hover:from-amber-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30 active:scale-95 border border-white/20 backdrop-blur-xl text-white font-black text-xs shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span className="uppercase tracking-widest text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300">
              Volver
            </span>
          </button>
        ) : (
          <div />
        )}

        {/* Center: Title emblem */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
            Novedades
          </h1>
        </div>

        {/* Right side live status pill */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Flux Center</span>
        </div>
      </header>

      {/* ISOLATED SUBMENUS BAR */}
      <div className="px-4 sm:px-8 py-3 bg-[#0a0b0e] border-b border-white/5 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex bg-[#12131a] p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "updates"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Actualizaciones</span>
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "guides"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Guías & Videos</span>
          </button>
        </div>

        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline-block">
          {filteredItems.length} {filteredItems.length === 1 ? "publicación" : "publicaciones"}
        </span>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto premium-scrollbar relative z-10 px-4 sm:px-8 pt-5 pb-20 max-w-[1400px] mx-auto w-full">
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
                    <video
                      src={item.videoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
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

                        {isAdmin && !item.id.startsWith("update-v") && (
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/20 rounded-full transition-all cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
