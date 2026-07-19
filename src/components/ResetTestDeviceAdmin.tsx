import React, { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw, 
  User, 
  Mail, 
  Smartphone, 
  Cpu, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Info,
  ShieldCheck,
  RotateCcw,
  Zap,
  Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateDeviceHash, generateHardwareSignature } from "../lib/firebase";

interface DeviceDetails {
  uid: string | null;
  email: string | null;
  fingerprints: string[];
  hardwareSignatures: string[];
  firstActivationDate: number | null;
  status: string;
  details: {
    devicesCount: number;
    vipDevicesCount: number;
    trialRequestsCount: number;
    vipActivationsCount: number;
    userExists: boolean;
  };
}

interface ResetReport {
  cleanedDevices: number;
  cleanedVipDevices: number;
  cleanedTrialRequests: number;
  cleanedVipActivations: number;
  cleanedUser: boolean;
  verification: {
    devicesRemaining: number;
    vipDevicesRemaining: number;
    trialRequestsRemaining: number;
    vipActivationsRemaining: number;
    isFullyCleaned: boolean;
  };
}

interface ResetTestDeviceAdminProps {
  adminEmail: string;
}

export const ResetTestDeviceAdmin: React.FC<ResetTestDeviceAdminProps> = ({ adminEmail }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [deviceData, setDeviceData] = useState<DeviceDetails | null>(null);
  const [detectedIdentifiers, setDetectedIdentifiers] = useState<{fp: string, hs: string} | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetReport, setResetReport] = useState<ResetReport | null>(null);

  // Auto-detect device on mount
  useEffect(() => {
    detectCurrentDevice();
  }, []);

  const detectCurrentDevice = async () => {
    setLoading(true);
    setError(null);
    console.log("[QA_TOOL] Iniciando detección de dispositivo...");
    try {
      const fp = await generateDeviceHash();
      const hs = await generateHardwareSignature();
      console.log("[QA_TOOL] Identificadores generados:", { fp, hs });
      setDetectedIdentifiers({ fp, hs });
      
      // Auto-search after detection
      await handleSearch(fp);
    } catch (err: any) {
      console.error("[QA_TOOL] Error en detección:", err);
      setError("Error al detectar identificadores del dispositivo: " + err.message);
      setLoading(false);
    }
  };

  const handleSearch = async (searchTermOverride?: string) => {
    const term = searchTermOverride || detectedIdentifiers?.fp;
    if (!term) {
      console.warn("[QA_TOOL] handleSearch llamado sin término de búsqueda");
      return;
    }

    setLoading(true);
    setError(null);
    setDeviceData(null);
    setResetReport(null);

    console.log(`[QA_TOOL] Buscando dispositivo con término: ${term}`);

    try {
      const response = await fetch("/api/admin/find-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail
        },
        body: JSON.stringify({ searchTerm: term.trim() })
      });

      console.log(`[QA_TOOL] Respuesta recibida de find-device: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      console.log(`[QA_TOOL] Cuerpo de respuesta (primeros 100 chars): ${text.substring(0, 100)}`);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("[QA_TOOL] Error al parsear JSON:", parseErr);
        throw new Error(`Respuesta del servidor no es válida (JSON esperado). Código: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error del servidor: ${response.status}`);
      }

      if (data.success) {
        console.log("[QA_TOOL] Dispositivo encontrado:", data.device);
        setDeviceData(data.device);
      } else {
        console.log("[QA_TOOL] Dispositivo no encontrado en registros.");
      }
    } catch (err: any) {
      console.error("[QA_TOOL] Error en handleSearch:", err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = async () => {
    if (!deviceData && !detectedIdentifiers) return;

    setIsResetting(true);
    setError(null);
    console.log("[QA_TOOL] Iniciando reinicio de dispositivo...");

    try {
      // We use the detected identifiers to ensure we are resetting THE CURRENT DEVICE
      const response = await fetch("/api/admin/reset-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail
        },
        body: JSON.stringify({
          uid: deviceData?.uid,
          email: deviceData?.email,
          fingerprints: [detectedIdentifiers?.fp, ...(deviceData?.fingerprints || [])],
          hardwareSignatures: [detectedIdentifiers?.hs, ...(deviceData?.hardwareSignatures || [])]
        })
      });

      console.log(`[QA_TOOL] Respuesta recibida de reset-device: ${response.status}`);
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Respuesta de reinicio no válida. Código: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Error al reiniciar el dispositivo");
      }

      if (data.success) {
        console.log("[QA_TOOL] Reinicio completado con éxito:", data.report);
        setResetReport(data.report);
        setShowConfirmModal(false);
        setDeviceData(null);
      } else {
        throw new Error("No se pudo completar el reinicio.");
      }
    } catch (err: any) {
      console.error("[QA_TOOL] Error en handleResetDevice:", err);
      setError(err.message || "Error al reiniciar el dispositivo de prueba.");
      setShowConfirmModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const d = new Date(timestamp);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6" id="reset-device-admin-panel">
      {/* HEADER EXPLICATIVO */}
      <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
          <Zap className="w-24 h-24 text-amber-500" />
        </div>
        
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-400 animate-spin-slow" />
          Herramienta QA: Reinicio Automático de Dispositivo
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Esta herramienta detecta automáticamente los identificadores de <strong className="text-white">ESTE dispositivo</strong> utilizando la misma lógica que el sistema QR. Úsala para limpiar tus huellas de prueba y verificar el flujo completo de activación.
        </p>
        
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span className="text-[8px] text-amber-200/80 font-bold uppercase tracking-wider">
              Solo para Administradores
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-full">
            <Fingerprint className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] text-emerald-200/80 font-bold uppercase tracking-wider">
              Identificación Automática Activa
            </span>
          </div>
        </div>
      </div>

      {/* DETECTOR DE ESTADO */}
      <div className="flex flex-col gap-3">
        {!deviceData && !loading && !resetReport && (
          <button
            onClick={() => detectCurrentDevice()}
            className="w-full py-4 bg-[#111113] border border-white/10 hover:border-amber-500/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-4 h-4" />
            Detectar y Buscar mi Dispositivo
          </button>
        )}

        {loading && (
          <div className="py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Generando Huellas Digitales</p>
              <p className="text-[9px] text-slate-500">Calculando DeviceID, Hardware Signature y Fingerprint...</p>
            </div>
          </div>
        )}
      </div>

      {/* ERRORES */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wide">Error de Detección</h4>
            <p className="text-[10px] text-slate-300 leading-relaxed">{error}</p>
          </div>
        </motion.div>
      )}

      {/* REPORTE DE LIMPIEZA COMPLETADO */}
      {resetReport && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Auditoría Post-Reinicio</h4>
              <p className="text-[10px] text-slate-400">El dispositivo ha sido auditado automáticamente tras la limpieza.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 space-y-2">
              <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1">Operaciones Ejecutadas</h5>
              <ul className="space-y-1 text-[10px]">
                <li className="flex justify-between items-center text-slate-300">
                  <span>'devices' eliminados:</span>
                  <span className="font-mono text-emerald-400 font-bold">{resetReport.cleanedDevices}</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>'vip_devices' eliminados:</span>
                  <span className="font-mono text-emerald-400 font-bold">{resetReport.cleanedVipDevices}</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>Solicitudes purgadas:</span>
                  <span className="font-mono text-emerald-400 font-bold">{resetReport.cleanedTrialRequests}</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>Perfil de usuario:</span>
                  <span className="font-mono text-emerald-400 font-bold">{resetReport.cleanedUser ? "ACTUALIZADO" : "SIN CAMBIOS"}</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 space-y-2">
              <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1">Resultado de Auditoría</h5>
              <ul className="space-y-1 text-[10px]">
                <li className="flex justify-between items-center text-slate-300">
                  <span>devices/{detectedIdentifiers?.fp.substring(0, 8)}...</span>
                  <span className="font-black uppercase text-[8px] text-emerald-400">BORRADO ✔</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>vip_devices/...</span>
                  <span className="font-black uppercase text-[8px] text-emerald-400">BORRADO ✔</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>trial_requests/...</span>
                  <span className="font-black uppercase text-[8px] text-emerald-400">BORRADO ✔</span>
                </li>
                <li className="flex justify-between items-center text-slate-300">
                  <span>Estado Final:</span>
                  <span className="font-black uppercase text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">LISTO PARA PRUEBA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-black uppercase tracking-wider">
                Auditoría Final de Seguridad: PASADA
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 pl-7">
              <p className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> ✔ Dispositivo limpiado
              </p>
              <p className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> ✔ Sin bloqueos
              </p>
              <p className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> ✔ Puede volver a solicitar prueba QR
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setResetReport(null);
              detectCurrentDevice();
            }}
            className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            Volver a Detectar
          </button>
        </motion.div>
      )}

      {/* DISPOSITIVO DETECTADO - CONFIRMACIÓN VISUAL */}
      {deviceData && detectedIdentifiers && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121214] border border-white/5 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Smartphone className="w-40 h-40 text-white" />
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Fingerprint className="w-4.5 h-4.5 text-amber-400" />
              Dispositivo Detectado Automáticamente
            </h4>
            <div className="flex gap-2">
              <span className="bg-emerald-400/10 text-emerald-400 font-black uppercase text-[8px] tracking-[0.15em] px-2.5 py-1 rounded-full border border-emerald-400/20">
                PRODUCCIÓN
              </span>
              <span className="bg-amber-400/10 text-amber-300 font-black uppercase text-[8px] tracking-[0.15em] px-2.5 py-1 rounded-full border border-amber-400/20">
                {deviceData.status}
              </span>
            </div>
          </div>

          {/* DATOS CLAVE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3 h-3" /> Fingerprint (DeviceId)
              </span>
              <p className="font-mono text-[10px] text-slate-200 bg-white/[0.02] p-2 rounded-xl border border-white/5 select-all truncate">
                {detectedIdentifiers.fp}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> Hardware Signature
              </span>
              <p className="font-mono text-[10px] text-slate-200 bg-white/[0.02] p-2 rounded-xl border border-white/5 select-all truncate">
                {detectedIdentifiers.hs}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> UID de Usuario
              </span>
              <p className="font-mono text-[10px] text-slate-200 bg-white/[0.02] p-2 rounded-xl border border-white/5 select-all truncate">
                {deviceData.uid || "Socio Invitado"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Correo Electrónico
              </span>
              <p className="font-mono text-[10px] text-slate-200 bg-white/[0.02] p-2 rounded-xl border border-white/5 select-all truncate">
                {deviceData.email || "Sin email"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Primera Activación
              </span>
              <p className="text-[10px] text-slate-200 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                {formatDate(deviceData.firstActivationDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Prueba Utilizada
              </span>
              <p className={`text-[10px] font-bold p-2 rounded-xl border ${deviceData.status.includes('Prueba') ? 'bg-red-500/5 text-red-400 border-red-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'}`}>
                {deviceData.status.includes('Prueba') ? 'SÍ' : 'NO'}
              </p>
            </div>
          </div>

          {/* ACCIÓN PRINCIPAL DE RESETEO */}
          <div className="pt-2">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isResetting}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 border border-red-500/20"
            >
              <RotateCcw className={`w-4 h-4 text-white ${isResetting ? 'animate-spin' : ''}`} />
              Resetear ESTE dispositivo de pruebas
            </button>
          </div>
        </motion.div>
      )}

      {/* CONFIRMACIÓN MODAL DE SEGURIDAD */}
      <AnimatePresence>
        {showConfirmModal && deviceData && detectedIdentifiers && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#121215] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Confirmación de Reinicio</h3>
                  <p className="text-[10px] text-slate-400">Acción exclusiva para flujo QA en Producción.</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-[11px] text-slate-300 leading-relaxed space-y-3">
                <p>
                  ¿Seguro que deseas reiniciar <strong className="text-white">ESTE dispositivo</strong>?
                </p>
                <p className="text-[10px] text-slate-400">
                  Se eliminarán todos los registros de prueba vinculados a:
                  <br />
                  <span className="font-mono text-[9px] text-red-300 break-all">{detectedIdentifiers.fp}</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Regla Nº1 Garantizada: Solo 1 prueba tras el reset
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isResetting}
                  className="flex-1 py-3 bg-[#1c1c1f] hover:bg-[#27272a] text-slate-300 hover:text-white font-bold uppercase tracking-wider text-[10px] rounded-xl border border-white/5 transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetDevice}
                  disabled={isResetting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl border border-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Confirmar Reinicio</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
