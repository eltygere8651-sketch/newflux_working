import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export interface FluxConnectTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  url: string;
  [key: string]: any;
}

export interface FluxConnectState {
  track: FluxConnectTrack | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isKaraoke: boolean;
  isFluxRadio: boolean;
  playlistId: string | null;
  updatedAt: number;
}

export interface FluxConnectSession {
  code: string;
  status: "waiting" | "connected" | "disconnected";
  createdAt: any;
  lastActive: any;
  clientState: FluxConnectState;
  deviceId?: string;
  deviceName?: string;
  connectedUserId?: string | null;
}

// Genera un código de sesión aleatorio de 6 caracteres alfanuméricos en mayúsculas
export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evitamos caracteres ambiguos como I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Crea una sesión de receptor (TV / Tablet)
export async function createReceiverSession(code: string, deviceName = "Smart TV"): Promise<void> {
  const sessionRef = doc(db, "flux_connect_sessions", code);
  const initialState: FluxConnectState = {
    track: null,
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    isKaraoke: false,
    isFluxRadio: false,
    playlistId: null,
    updatedAt: Date.now(),
  };

  const sessionData: FluxConnectSession = {
    code,
    status: "waiting",
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    clientState: initialState,
    deviceName,
    deviceId: "tv_" + Math.random().toString(36).substring(2, 11),
  };

  await setDoc(sessionRef, sessionData);
}

// Une un dispositivo principal (móvil/PC) a una sesión existente de TV
export async function joinSessionAsController(
  code: string,
  userId: string | null
): Promise<FluxConnectSession> {
  const sessionRef = doc(db, "flux_connect_sessions", code.toUpperCase().trim());
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error("La sesión no existe o el código es inválido.");
  }

  const data = snap.data() as FluxConnectSession;
  if (data.status === "disconnected") {
    throw new Error("La sesión ya ha expirado o se ha desconectado.");
  }

  // Actualizar el estado de la sesión a conectada
  await updateDoc(sessionRef, {
    status: "connected",
    connectedUserId: userId,
    lastActive: serverTimestamp(),
  });

  return {
    ...data,
    status: "connected",
    connectedUserId: userId,
  };
}

// Envía una actualización de estado desde el dispositivo controlador (móvil) a la TV
export async function sendControllerStateUpdate(
  code: string,
  state: Partial<FluxConnectState>
): Promise<void> {
  const sessionRef = doc(db, "flux_connect_sessions", code.toUpperCase().trim());
  
  // Obtenemos el documento primero para asegurar que no sobrescribimos campos no enviados
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return;

  const currentData = snap.data() as FluxConnectSession;
  const updatedClientState: FluxConnectState = {
    ...currentData.clientState,
    ...state,
    updatedAt: Date.now(),
  };

  await updateDoc(sessionRef, {
    clientState: updatedClientState,
    lastActive: serverTimestamp(),
  });
}

// Desconecta una sesión
export async function disconnectSession(code: string): Promise<void> {
  try {
    const sessionRef = doc(db, "flux_connect_sessions", code.toUpperCase().trim());
    await updateDoc(sessionRef, {
      status: "disconnected",
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Error desconectando sesión:", err);
  }
}

// Escucha en tiempo real una sesión de Flux Connect
export function subscribeToSession(
  code: string,
  onUpdate: (session: FluxConnectSession | null) => void,
  onError?: (error: any) => void
) {
  const sessionRef = doc(db, "flux_connect_sessions", code.toUpperCase().trim());
  return onSnapshot(
    sessionRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as FluxConnectSession);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
