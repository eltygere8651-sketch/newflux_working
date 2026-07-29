import React, { useState } from "react";
import { Sparkles, X, Loader2, Send, Clock, Tag, AlignLeft } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface PromotePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    id: string;
    title: string;
    thumbnail?: string;
    artist?: string;
    description?: string;
  };
  onSuccess: () => void;
}

export const PromotePlaylistModal: React.FC<PromotePlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  onSuccess,
}) => {
  const [durationHours, setDurationHours] = useState<number>(12);
  const [genre, setGenre] = useState<string>("Reggaetón & Urbano");
  const [customDescription, setCustomDescription] = useState<string>(
    playlist.description || "Los temas más fuertes del momento en Flux Music"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePromote = async () => {
    try {
      setIsSubmitting(true);
      const now = Date.now();
      const expiresAt = now + durationHours * 3600 * 1000;

      const featuredDoc = {
        playlistId: playlist.id,
        title: playlist.title || "Nueva Playlist Destacada",
        image: playlist.thumbnail || `https://i.ytimg.com/vi/${playlist.id}/hqdefault.jpg`,
        genre: genre || "Destacado",
        description: customDescription || "Nueva playlist recomendada",
        publishedAt: now,
        expiresAt: expiresAt,
        priority: 1,
        active: true,
        durationHours: durationHours,
      };

      // Reset seen status locally so new promotion is immediately visible to tester
      try {
        const raw = localStorage.getItem("seen_featured_updates");
        if (raw) {
          let list: string[] = JSON.parse(raw);
          list = list.filter((id) => id !== playlist.id);
          localStorage.setItem("seen_featured_updates", JSON.stringify(list));
        }
      } catch (e) {
        console.warn("Could not reset seen status:", e);
      }

      // 1. Single write to Firestore featured_updates collection
      await addDoc(collection(db, "featured_updates"), featuredDoc);

      // 2. Dispatch FCM Push Notification to topic "all_users"
      try {
        await fetch("/api/admin/notify-featured-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "🔥 Nueva playlist en Flux Music",
            body: `Descubre "${playlist.title}"`,
            playlistId: playlist.id,
            image: featuredDoc.image,
          }),
        });
      } catch (fcmErr) {
        console.warn("FCM topic dispatch notice:", fcmErr);
      }

      // 3. Trigger local refresh
      window.dispatchEvent(new Event("refreshFeaturedUpdates"));

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error promoting playlist:", err);
      alert("Error al destacar la playlist: " + (err.message || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#121212] border border-[#1ED760]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#1ED760]/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-[#1ED760]/20 rounded-xl text-[#1ED760]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-extrabold text-base">Promocionar Playlist</h3>
            <p className="text-xs text-slate-400">Publicar banner de destacados para todos los usuarios</p>
          </div>
        </div>

        {/* Selected Playlist Preview */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-4">
          <img
            src={playlist.thumbnail || `https://i.ytimg.com/vi/${playlist.id}/hqdefault.jpg`}
            alt={playlist.title}
            className="w-12 h-12 object-cover rounded-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{playlist.title}</h4>
            <p className="text-xs text-slate-400 truncate">{playlist.artist || "YouTube Music"}</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Duration Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#1ED760]" />
              Duración de la Promoción
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { hours: 12, label: "12 Horas" },
                { hours: 24, label: "24 Horas" },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setDurationHours(opt.hours)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    durationHours === opt.hours
                      ? "bg-[#1ED760] text-black border-[#1ED760] shadow-md shadow-[#1ED760]/20"
                      : "bg-[#1A1A1A] text-slate-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Tag */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-[#1ED760]" />
              Género / Etiqueta
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ej: Reggaetón 2026, Urbano, Fitness, Lo-Fi"
              className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#1ED760] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-[#1ED760]" />
              Descripción para Banner
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Ej: Los temas más fuertes del momento"
              rows={2}
              className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#1ED760] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePromote}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-[#1ED760] text-black text-xs font-bold rounded-full hover:bg-[#1fdb62] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#1ED760]/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 fill-black" />
                <span>Lanzar Promoción 🔥</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
