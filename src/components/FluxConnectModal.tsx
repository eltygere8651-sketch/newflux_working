import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Tv,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wifi,
  Sparkles,
} from "lucide-react";
import {
  joinSessionAsController,
  disconnectSession,
  subscribeToSession,
  FluxConnectSession,
} from "../lib/fluxConnect";
import { useFirebase } from "./FirebaseProvider";

interface FluxConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FluxConnectModal({ isOpen, onClose }: FluxConnectModalProps) {
  const { user } = useFirebase();
  const [code, setCode] = useState<string>("");
  const [activeCode, setActiveCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem("flux_connect_active_code");
    } catch (e) {
      console.warn("Storage access not allowed:", e);
      return null;
    }
  });
  const [session, setSession] = useState<FluxConnectSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Subscribe to existing session on load or code change
  useEffect(() => {
    if (!activeCode) {
      setSession(null);
      return;
    }

    const unsubscribe = subscribeToSession(
      activeCode,
      (updatedSession) => {
        if (updatedSession && updatedSession.status !== "disconnected") {
          setSession(updatedSession);
        } else {
          // If the session was disconnected remotely or doesn't exist
          handleLocalDisconnect();
        }
      },
      (err) => {
        console.error("Session subscription error:", err);
      }
    );

    return unsubscribe;
  }, [activeCode]);

  // Read query parameter '?connect=CODE' on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectParam = params.get("connect");
    if (connectParam && connectParam.length === 6) {
      setCode(connectParam.toUpperCase());
      // Attempt automatic connection if modal is opened
      if (isOpen) {
        handleConnect(connectParam.toUpperCase());
      }
    }
  }, [isOpen]);

  const handleLocalDisconnect = () => {
    try {
      localStorage.removeItem("flux_connect_active_code");
    } catch (e) {
      console.warn("Storage write not allowed:", e);
    }
    setActiveCode(null);
    setSession(null);
    window.dispatchEvent(
      new CustomEvent("flux-connect-changed", { detail: { code: null } })
    );
  };

  const handleConnect = async (targetCode?: string) => {
    const codeToConnect = (targetCode || code).toUpperCase().trim();
    if (codeToConnect.length !== 6) {
      setError("El código debe tener exactamente 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinSessionAsController(codeToConnect, user?.uid || "anonymous_user");
      
      try {
        localStorage.setItem("flux_connect_active_code", codeToConnect);
      } catch (e) {
        console.warn("Storage write not allowed:", e);
      }
      setActiveCode(codeToConnect);
      setSuccess(true);
      setError(null);

      // Dispatch global event for the main player component
      window.dispatchEvent(
        new CustomEvent("flux-connect-changed", { detail: { code: codeToConnect } })
      );

      // Clear search query param cleanly without reloading the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Flux Connect Connection Error:", err);
      setError(err.message || "Error al conectar. Verifica el código e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (activeCode) {
      await disconnectSession(activeCode);
    }
    handleLocalDisconnect();
  };

  if (!isOpen) return null;

  return (
    <div
      id="flux-connect-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-md bg-[#0d0d11] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white overflow-hidden text-left"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Flux Connect
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ACTIVE CONNECTION STATE */}
        {activeCode && session ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Estado: Sincronizado
                </div>
                <h4 className="text-sm font-black text-white truncate uppercase">
                  {session.deviceName || "Smart TV"}
                </h4>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                  Código de sesión: <span className="font-mono font-black text-white">{activeCode}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-bold leading-relaxed bg-[#141419]/50 border border-white/5 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                Cualquier cambio de track, play/pause, seek, volumen o modo Karaoke que realices se aplicará instantáneamente en la pantalla del receptor de forma transparente.
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-lg active:scale-[0.98]"
              >
                Desconectar Dispositivo
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-extrabold rounded-2xl uppercase text-[11px] tracking-wider transition-all cursor-pointer"
              >
                Mantener Activo
              </button>
            </div>
          </div>
        ) : (
          /* NO CONNECTION STATE (CONNECT FORM) */
          <div className="space-y-6">
            <div className="text-sm text-slate-400 font-bold leading-relaxed">
              Vincúlate con cualquier navegador o TV inteligente de tu red para disfrutar de tu música. 
              <br />
              <span className="text-slate-500">Abre <strong className="text-emerald-400 font-black">fluxmusic.com/connect</strong> (o la URL de esta app + /connect) en el receptor para obtener el código.</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>¡Dispositivo conectado con éxito!</span>
              </div>
            )}

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Código de 6 caracteres
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                placeholder="ABCDEF"
                disabled={loading}
                className="w-full text-center tracking-[0.2em] font-mono text-3xl font-black bg-[#131317] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500/50 uppercase placeholder-slate-700 transition-colors"
              />
            </div>

            {/* Connect Button */}
            <button
              onClick={() => handleConnect()}
              disabled={loading || code.trim().length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-[#1ED760] disabled:from-emerald-900 disabled:to-emerald-950 disabled:text-slate-500 text-black font-extrabold rounded-2xl uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[0_4px_15px_rgba(30,215,96,0.15)] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Tv className="w-4 h-4" />
                  <span>Conectar Dispositivo</span>
                </>
              )}
            </button>

            {/* Quick Helper */}
            <div className="pt-2 border-t border-white/[0.03] flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              <Smartphone className="w-4 h-4" />
              <span>Funciona en cualquier TV, tablet o PC</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
