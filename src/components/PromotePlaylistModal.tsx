import React, { useState } from "react";
import { Sparkles, X, Loader2, Send, Tag, AlignLeft, Calendar } from "lucide-react";
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
  const [customDescription, setCustomDescription] = useState<string>(
    playlist.description || "Escucha esta playlist recomendada"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePromote = async () => {
    try {
      setIsSubmitting(true);
      const now = Date.now();
      const expiresAt = now + 24 * 3600 * 1000; // Fixed 24 hours

      const featuredDoc = {
        playlistId: playlist.id,
        title: playlist.title || "Nueva Playlist Destacada",
        image: playlist.thumbnail || `https://i.ytimg.com/vi/${playlist.id}/hqdefault.jpg`,
        genre: "Destacado",
        description: customDescription || "Nueva playlist recomendada",
        publishedAt: now,
        expiresAt: expiresAt,
        priority: 1,
        active: true,
        durationHours: 24,
      };

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#121212] border border-[#1ED760]/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#1ED760]/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 mt-2">
          <div className="p-2.5 bg-[#1ED760]/20 rounded-xl text-[#1ED760]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-extrabold text-lg">Promocionar Playlist</h3>
            <p className="text-xs sm:text-sm text-slate-400">Publicar banner destacado a todos los usuarios</p>
          </div>
        </div>

        {/* Selected Playlist Preview */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-5">
          <img
            src={playlist.thumbnail || `https://i.ytimg.com/vi/${playlist.id}/hqdefault.jpg`}
            alt={playlist.title}
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate leading-tight mb-1">{playlist.title}</h4>
            <p className="text-xs text-slate-400 truncate">{playlist.artist || "YouTube Music"}</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          
          <div className="bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-xl p-3 flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#1ED760] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1ED760]/90 leading-relaxed font-medium">
              Esta promoción se mantendrá <b>fija y visible</b> en el inicio de todos los usuarios durante exactamente <b>24 horas</b>.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-[#1ED760]" />
              Mensaje en el Banner
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Ej: Los temas más fuertes del momento..."
              rows={3}
              className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1ED760] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-full transition-colors text-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePromote}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-[#1ED760] text-black text-sm font-bold rounded-xl sm:rounded-full hover:bg-[#1fdb62] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1ED760]/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 fill-black" />
                <span>Lanzar Promoción 🔥</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
