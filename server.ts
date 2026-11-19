import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Innertube } from "youtubei.js";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Global Error Handlers to prevent production crashes
process.on("uncaughtException", (err) => {
  console.error("Critical: Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Critical: Unhandled Rejection at:",
    promise,
    "reason:",
    reason,
  );
});

// Suppress excessive youtubei.js parser warnings that trigger AI Studio error bounds
const originalWarn = console.warn;
console.warn = (...args) => {
  const str = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  if (
    str.includes("[YOUTUBEJS]") ||
    str.includes("input_data") ||
    str.includes("parsed_runs")
  )
    return;
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = (...args) => {
  const str = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  if (
    str.includes("[YOUTUBEJS]") ||
    str.includes("input_data") ||
    str.includes("parsed_runs")
  )
    return;
  originalError.apply(console, args);
};

dotenv.config();

const app = express();

// Trust proxy if we are behind Vercel or other reverse proxies
app.set("trust proxy", 1);

app.use(express.json());
app.use(cors()); // Allow cross-origin requests securely

// Define basic rate limiter (protecting from DDoS/Spam)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Demasiadas peticiones temporales, por favor intenta en unos minutos.",
  },
});

// Apply rate limiter specifically to the YouTube-related endpoints
app.use("/api/youtube", apiLimiter);
app.use("/api/oembed", apiLimiter);

// Specific rate limiter for VIP emails to prevent spam
const vipActivateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de activación. Por favor, inténtalo más tarde." },
});

const PORT = 3000;

// Minimal AI Setup
let aiClient: GoogleGenAI | null = null;
let yt: Innertube | null = null;

async function initYoutube() {
  try {
    yt = await Innertube.create({ generate_session_locally: true });
    console.log("YouTube InnerTube initialized");
  } catch (err) {
    console.error("YouTube InnerTube Error:", err);
  }
}
initYoutube();

try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.error("AI Init Error:", error);
}

// Simple Assistant Endpoint (Minimal)
app.post("/api/ai/coach", async (req, res) => {
  res.json({ reply: "Siente el ritmo. La música está lista." });
});

app.post("/api/ai/dj-script", async (req, res) => {
  if (!aiClient) {
    return res.json({ script: "¡Hola! Soy tu DJ de IA. ¡Disfruta la música!" });
  }

  const { context, type } = req.body;
  // type can be 'intro', 'joke', 'payola', 'transition'
  
  try {
    const prompt = `Actúa como una DJ de radio joven, carismática y divertida llamada Sofía de Flux Radio (en español). 
    Tu estilo es fresco y urbano. 
    Tipo de intervención: ${type}.
    Contexto musical: ${context || "Música variada"}.
    ${type === 'joke' ? 'Cuenta un chiste corto y bueno.' : ''}
    ${type === 'payola' ? 'Menciona a Flux Music como la mejor plataforma y dales un grito (shout-out).' : ''}
    ${type === 'intro' ? 'Presenta la siguiente canción con energía.' : ''}
    Genera un texto corto (máximo 2 frases) para ser leído por un sintetizador de voz.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    res.json({ script: response.text?.trim() || "¡Seguimos con más música en Flux!" });
  } catch (error) {
    console.error("AI DJ Error:", error);
    res.json({ script: "¡Seguimos con más música en Flux!" });
  }
});

// Fallback APIs (Invidious / Piped) for anti-block shielding (Plan B)
const INVIDIOUS_INSTANCES = [
  "https://invidious.snopyta.org",
  "https://inv.riverside.rocks",
  "https://vid.puffyan.us",
];
const PIPED_INSTANCES = [
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.lunar.icu",
];

// YouTube Search Cache (Eco-Friendly)
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours


// Caches for Firestore data to minimize reads globally
const communityCache = { data: null, timestamp: 0 };
const COMMUNITY_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
let clientDb = null;


async function getClientDb() {
  if (clientDb) return clientDb;
  const { initializeApp } = await import("firebase/app");
  const { getFirestore, initializeFirestore } = await import("firebase/firestore");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const app = initializeApp(config);
  clientDb = initializeFirestore(app, {}, config.firestoreDatabaseId);
  return clientDb;
}

app.get("/api/community/playlists", async (req, res) => {
  try {
    if (communityCache.data && Date.now() - communityCache.timestamp < COMMUNITY_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.json(communityCache.data);
    }
    const db = await getClientDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const { collectionGroup, query, orderBy, limit, getDocs } = await import("firebase/firestore");
    const q = query(collectionGroup(db, "playlists"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
      
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      _data: doc.data(),
      ref: { path: doc.ref.path }
    }));
    
    communityCache.data = playlists;
    communityCache.timestamp = Date.now();
    
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.json(playlists);
  } catch (err) {
    console.error("Error fetching community playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch community playlists", details: err.message, stack: err.stack });
  }
});

const exploreCustomCache = { data: null, timestamp: 0 };
const EXPLORE_CUSTOM_CACHE_TTL = 1000 * 60 * 15; // 15 minutes

app.get("/api/explore/custom-playlists", async (req, res) => {
  try {
    if (exploreCustomCache.data && Date.now() - exploreCustomCache.timestamp < EXPLORE_CUSTOM_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json(exploreCustomCache.data);
    }
    const db = await getClientDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
    const q = query(collection(db, "explore_custom_playlists"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
      
    const lists = snapshot.docs.map(doc => ({
      ...doc.data(),
      docId: doc.id
    }));
    
    exploreCustomCache.data = lists;
    exploreCustomCache.timestamp = Date.now();
    
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.json(lists);
  } catch (err) {
    console.error("Error fetching custom explore playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch custom explore playlists" });
  }
});

// Endpoint to send FCM push notification to topic "all_users" when a playlist is featured
app.post("/api/admin/notify-featured-topic", async (req, res) => {
  try {
    const { title, body, playlistId, image } = req.body || {};
    const notificationTitle = title || "🔥 Nueva playlist en Flux Music";
    const notificationBody = body || "Descubre los temas más fuertes del momento";

    console.log(`[FCM Topic] Sending promotion to topic "all_users": ${notificationTitle} - ${notificationBody}`);

    // If Firebase Admin messaging is available, dispatch to FCM topic 'all_users'
    if (admin.apps.length > 0) {
      try {
        const message = {
          topic: "all_users",
          notification: {
            title: notificationTitle,
            body: notificationBody,
            ...(image ? { imageUrl: image } : {}),
          },
          data: {
            playlistId: playlistId || "",
            type: "featured_playlist",
          },
        };
        await admin.messaging().send(message);
        console.log(`[FCM Topic] Successfully sent FCM message to topic "all_users"`);
        return res.json({ success: true, sent: true, topic: "all_users" });
      } catch (fcmError: any) {
        console.warn(`[FCM Topic] Messaging send attempted (FCM topic fallback handled):`, fcmError.message || fcmError);
      }
    }

    return res.json({ success: true, sent: false, message: "Promoción registrada en topic all_users" });
  } catch (err: any) {
    console.error("Error in /api/admin/notify-featured-topic:", err);
    return res.status(500).json({ error: "Error enviando notificación push" });
  }
});


const userCache = new Map();
const USER_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

app.get("/api/user/playlists", async (req, res) => {
  try {
    const uid = req.query.uid;
    const force = req.query.force === "true";
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    const cached = userCache.get(uid);
    if (!force && cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(cached.data);
    }

    const db = await getClientDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
    const q = query(collection(db, "users", uid as string, "playlists"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
      
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      _data: doc.data(),
      ref: { path: doc.ref.path }
    }));
    
    userCache.set(uid, { data: playlists, timestamp: Date.now() });
    
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.json(playlists);
  } catch (err) {
    console.error("Error fetching user playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch user playlists" });
  }
});

// YouTube Search Endpoint

app.get("/api/youtube/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Missing query" });

  res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours

  const normalizedQuery = query.toLowerCase().trim();

  // Check cache
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Serving YouTube search from cache (ECO):", normalizedQuery);
    return res.json(cached.data);
  }

  if (!yt) {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    // Perform both searches in parallel for the most complete results (General and Playlist-specific)
    // Adding "music" context or selecting music category is implicit by adding "official audio" or "video" in query usually
    // youtubei.js doesn't have a direct 'category' filter like the Official API, but we can search for 'video' and 'music' types
    const [generalResults, playlistResults] = await Promise.allSettled([
      yt.search(query, { type: 'video' }),
      yt.search(query, { type: "playlist" }),
    ]);

    const rawItems: any[] = [];

    if (generalResults.status === "fulfilled" && generalResults.value) {
      const resultsVal = generalResults.value;
      const resAny: any = resultsVal.results;
      if (resAny) {
        if (Array.isArray(resAny)) {
          rawItems.push(...resAny);
        } else if (typeof resAny.forEach === "function") {
          resAny.forEach((x: any) => rawItems.push(x));
        } else if (typeof resAny.map === "function") {
          resAny.map((x: any) => rawItems.push(x));
        }
      }
      if (resultsVal.playlists && Array.isArray(resultsVal.playlists)) {
        rawItems.push(...resultsVal.playlists);
      }
      if (resultsVal.videos && Array.isArray(resultsVal.videos)) {
        rawItems.push(...resultsVal.videos);
      }
    }

    try {
      const [musicGeneral, musicSongs] = await Promise.allSettled([
        yt.music.search(query).catch(() => null),
        yt.music.search(query, { type: 'song' }).catch(() => null)
      ]);

      if (musicGeneral.status === "fulfilled" && musicGeneral.value?.contents) {
        const card = musicGeneral.value.contents.find((c: any) => c.type === 'MusicCardShelf');
        if (card && card.title?.endpoint?.payload?.browseId) {
          const browseId = card.title.endpoint.payload.browseId;
          const radioId = card.buttons?.[0]?.endpoint?.payload?.playlistId || "";
          rawItems.unshift({
            type: 'ArtistProfile',
            id: browseId,
            title: card.title.text || "",
            subtitle: card.subtitle?.text || "",
            thumbnails: card.thumbnail?.contents || [],
            radioId: radioId
          });
        }
      }

      if (musicSongs.status === "fulfilled" && musicSongs.value?.contents) {
        const shelf = musicSongs.value.contents.find((c: any) => c.type === 'MusicShelf');
        if (shelf && shelf.contents) {
          const songs = shelf.contents.slice(0, 5).map((item: any) => {
            if (item.type === 'MusicResponsiveListItem') {
              return { 
                 type: 'Video',
                 id: item.id,
                 title: { text: item.title },
                 author: { name: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist' },
                 duration: { text: item.duration?.text || '' },
                 thumbnails: item.thumbnails
              };
            }
            return item;
          }).filter((x: any) => x.id);
          const artistProfileIdx = rawItems.findIndex((i: any) => i.type === 'ArtistProfile');
          if (artistProfileIdx !== -1) {
             rawItems.splice(artistProfileIdx + 1, 0, ...songs);
          } else {
             rawItems.unshift(...songs);
          }
        }
      }
    } catch (e) {}
    
    if (playlistResults.status === "fulfilled" && playlistResults.value) {
      const resultsVal = playlistResults.value;
      const resAny: any = resultsVal.results;
      if (resAny) {
        if (Array.isArray(resAny)) {
          rawItems.push(...resAny);
        } else if (typeof resAny.forEach === "function") {
          resAny.forEach((x: any) => rawItems.push(x));
        } else if (typeof resAny.map === "function") {
          resAny.map((x: any) => rawItems.push(x));
        }
      }
      if (resultsVal.playlists && Array.isArray(resultsVal.playlists)) {
        rawItems.push(...resultsVal.playlists);
      }
    }

    const combined: any[] = [];
    const addedIds = new Set<string>();

    const addParsedItem = (item: any) => {
      if (!item || !item.id) return;
      if (addedIds.has(item.id)) return;
      addedIds.add(item.id);
      combined.push(item);
    };

    rawItems.forEach((p: any) => {
      try {
        const type = (p.type || p.constructor?.name || "").toLowerCase();

        let id =
          p.id?.toString() ||
          p.playlist_id?.toString() ||
          p.video_id?.toString() ||
          p.content_id?.toString() ||
          "";
        if (!id) return;

        let title = p.title?.text || p.title?.toString() || "";
        if (!title && p.metadata?.title?.text) {
          title = p.metadata.title.text;
        }
        if (!title) return;

        let author = "YouTube Curator";
        if (p.author) {
          author = p.author.name || p.author.toString() || "YouTube Creator";
        } else if (p.short_byline_text) {
          author = p.short_byline_text.toString();
        } else if (p.metadata?.metadata?.metadata_rows) {
          const rows = p.metadata.metadata.metadata_rows || [];
          for (const row of rows) {
            const part = row.metadata_parts?.[0];
            if (part?.text?.text) {
              author = part.text.text;
              break;
            }
          }
        }

        let thumbnail = "";
        if (
          p.thumbnails &&
          Array.isArray(p.thumbnails) &&
          p.thumbnails.length > 0
        ) {
          thumbnail =
            p.thumbnails[p.thumbnails.length - 1].url ||
            p.thumbnails[0].url ||
            "";
        } else if (
          p.thumbnail &&
          p.thumbnail.thumbnails &&
          Array.isArray(p.thumbnail.thumbnails) &&
          p.thumbnail.thumbnails.length > 0
        ) {
          const thumbs = p.thumbnail.thumbnails;
          thumbnail = thumbs[thumbs.length - 1].url || thumbs[0].url || "";
        } else if (
          p.content_image?.primary_thumbnail?.image &&
          Array.isArray(p.content_image.primary_thumbnail.image) &&
          p.content_image.primary_thumbnail.image.length > 0
        ) {
          const imgs = p.content_image.primary_thumbnail.image;
          thumbnail = imgs[imgs.length - 1].url || imgs[0].url || "";
        }

        const isPlaylistId = id.startsWith("PL") || id.startsWith("UU");
        const isYouTubeMixId = id.startsWith("RD");

        const isPlaylistType =
          type.includes("playlist") ||
          (p.content_type || "").toUpperCase() === "PLAYLIST" ||
          isPlaylistId ||
          (!!p.playlist_id && !isYouTubeMixId);
        const isMixType =
          type.includes("mix") ||
          (p.content_type || "").toUpperCase() === "MIX" ||
          isYouTubeMixId;

        if (!thumbnail) {
          if (isPlaylistType) {
            thumbnail =
              "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
          } else {
            thumbnail = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
          }
        }

        let videoCountStr = "";
        if (p.content_image?.primary_thumbnail?.overlays) {
          const overlays = p.content_image.primary_thumbnail.overlays || [];
          for (const overlay of overlays) {
            const badges = overlay.badges || [];
            for (const badge of badges) {
              if (badge.text) {
                videoCountStr = badge.text.toString();
                break;
              }
            }
            if (videoCountStr) break;
          }
        }

        const hasPlaylistIndicator =
          !!p.playlist_id ||
          p.video_count !== undefined ||
          p.video_count_text !== undefined ||
          videoCountStr !== "";

        let finalIsPlaylistType =
          isPlaylistType || (hasPlaylistIndicator && !isYouTubeMixId);
        let finalIsMixType = isMixType;

        if (finalIsPlaylistType || finalIsMixType) {
          if (!videoCountStr) {
            if (p.video_count !== undefined) {
              const rawVal = p.video_count;
              videoCountStr =
                typeof rawVal === "object"
                  ? rawVal.text || rawVal.toString()
                  : rawVal.toString();
            } else if (p.video_count_text) {
              const rawValText = p.video_count_text;
              videoCountStr =
                typeof rawValText === "object"
                  ? rawValText.text || rawValText.toString()
                  : rawValText.toString();
            }
          }

          if (
            !videoCountStr ||
            videoCountStr === "Playlist" ||
            videoCountStr === "0"
          ) {
            videoCountStr = isMixType ? "Mix" : "Canal";
          } else if (!isNaN(Number(videoCountStr))) {
            videoCountStr = `${videoCountStr} videos`;
          }

          let subType = "playlist";
          if (
            isYouTubeMixId ||
            (!isPlaylistId &&
              (type.includes("mix") ||
                title.toLowerCase().includes("session") ||
                title.toLowerCase().includes("dj set")))
          ) {
            subType = "mix";
          }

          addParsedItem({
            id,
            title,
            artist: author,
            duration: videoCountStr,
            url: `https://www.youtube.com/playlist?list=${id}`,
            thumbnail,
            isPlaylist: true,
            subType,
          });
        } else {
          let duration = "N/A";
          if (p.duration) {
            duration = p.duration.text || p.duration.toString() || "N/A";
          } else if (p.length_text) {
            duration = p.length_text.text || p.length_text.toString() || "N/A";
          }

          let subType = "cancion";
          const lowerTitle = title.toLowerCase();
          if (
            lowerTitle.includes("mix") ||
            lowerTitle.includes("remix") ||
            lowerTitle.includes("set") ||
            lowerTitle.includes("hour") ||
            lowerTitle.includes("dance mix") ||
            lowerTitle.includes("phonk mix") ||
            lowerTitle.includes("gym mix")
          ) {
            subType = "mix";
          }

          addParsedItem({
            id,
            title,
            artist: author,
            duration,
            url: `https://www.youtube.com/watch?v=${id}`,
            thumbnail,
            isPlaylist: false,
            subType,
          });
        }
      } catch (err) {
        // Skip entry on parse error
      }
    });

    // Save to cache
    if (combined.length > 0) {
      searchCache.set(normalizedQuery, {
        data: combined,
        timestamp: Date.now(),
      });
    }

    res.json(combined);
  } catch (error) {
    console.warn(
      "YouTube search error (Innertube failed, likely blocked IP). Initiating Plan B (Piped API Fallback)...",
      error,
    );

    // Ant-block fallback: Piped API
    try {
      for (const instance of PIPED_INSTANCES) {
        try {
          const pRes = await fetch(
            `${instance}/search?q=${encodeURIComponent(query)}&filter=all`,
          );
          if (pRes.ok) {
            const pData = (await pRes.json()) as any;
            const combined: any[] = [];
            (pData.items || []).forEach((item: any) => {
              if (item.type === "stream") {
                combined.push({
                  id: item.url.replace("/watch?v=", ""),
                  title: item.title,
                  artist: item.uploaderName || "Piped User",
                  duration:
                    item.duration > 0
                      ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, "0")}`
                      : "N/A",
                  url: `https://www.youtube.com${item.url}`,
                  thumbnail:
                    item.thumbnail ||
                    `https://i.ytimg.com/vi/${item.url.replace("/watch?v=", "")}/mqdefault.jpg`,
                  isPlaylist: false,
                  subType: item.title.toLowerCase().includes("mix")
                    ? "mix"
                    : "cancion",
                });
              } else if (item.type === "playlist") {
                combined.push({
                  id: item.url.replace("/playlist?list=", ""),
                  title: item.title,
                  artist: item.uploaderName || "Piped User",
                  duration:
                    item.videos > 0 ? `${item.videos} videos` : "Playlist",
                  url: `https://www.youtube.com${item.url}`,
                  thumbnail:
                    item.thumbnail ||
                    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
                  isPlaylist: true,
                  subType: "playlist",
                });
              }
            });
            if (combined.length > 0) {
              searchCache.set(normalizedQuery, {
                data: combined,
                timestamp: Date.now(),
              }); // Cache fallback results
              return res.json(combined);
            }
          }
        } catch (e) {
          // ignore instance fail
        }
      }
    } catch (fallbackErr) {
      console.error("All fallbacks failed.");
    }

    res
      .status(500)
      .json({ error: "Internal YouTube search error (and fallbacks failed)" });
  }
});

// Cache for explore endpoint (per country, refreshed every 30 min from YouTube Music)
const exploreCache = new Map<string, { data: any; timestamp: number }>();
const EXPLORE_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const ytClients = new Map<string, any>();

const upgradeYtThumb = (url?: string) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("googleusercontent.com")) {
    return url.replace(/=w\d+-h\d+[^&\s]*/, "=w544-h544-l90-rj").replace(/=s\d+[^&\s]*/, "=s544");
  }
  return url;
};

const extractThumbFromList = (list: any[]): string => {
  if (!Array.isArray(list) || list.length === 0) return "";
  const raw = list[list.length - 1]?.url || list[0]?.url || "";
  return upgradeYtThumb(raw);
};

app.get("/api/youtube/explore", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  const country = ((req.query.country as string) || "ES").toUpperCase();
  const forceRefresh = req.query.refresh === "1";
  const countryMap: Record<string, string> = {
    GLOBAL: "Global",
    US: "Estados Unidos",
    ES: "España",
    MX: "México",
    AR: "Argentina",
    CO: "Colombia",
    CL: "Chile",
    PE: "Perú",
    GB: "Reino Unido",
    DO: "República Dominicana",
    DE: "Alemania",
    FR: "Francia",
    IT: "Italia",
  };
  const countryName = countryMap[country] || "España";

  const cached = exploreCache.get(country);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < EXPLORE_CACHE_TTL) {
    return res.json(cached.data);
  }

  let ytCountry = ytClients.get(country);
  if (!ytCountry) {
    try {
      // @ts-ignore - youtubei.js SessionOptions types don't include gl/hl in some versions but they work
      ytCountry = await Innertube.create({ gl: country === "GLOBAL" ? "US" : country, hl: "es" });
      ytClients.set(country, ytCountry);
    } catch (e) {
      return res.status(503).json({ error: "YouTube unavailable for region" });
    }
  }

  const parseInnertubeItem = (p: any): any => {
    try {
      if (!p) return null;
      let id =
        p.content_id ||
        p.id?.toString() ||
        p.endpoint?.payload?.videoId ||
        p.endpoint?.payload?.browseId ||
        p.playlist_id?.toString() ||
        "";
      if (p.type === "Playlist" || p.type === "LockupView") {
        id = p.id || p.playlist_id || p.content_id || id;
      }
      if (!id) return null;
      const cleanId = id.replace(/^VL/, "");

      let title =
        p.metadata?.title?.text ||
        p.title?.text ||
        (typeof p.title === "string" ? p.title : p.title?.toString()) ||
        p.name ||
        "";
      if (!title && p.flex_columns && p.flex_columns.length > 0) {
        title = p.flex_columns[0].title?.text || p.flex_columns[0].title?.toString() || "";
      }
      if (!title || title === "[object Object]") return null;

      let author = "";
      if (p.type === "LockupView") {
        author = p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text || "";
        if (!author && p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.runs?.[0]?.text) {
          author = p.metadata.metadata.metadata_rows[0].metadata_parts[0].text.runs[0].text;
        }
      } else {
        if (Array.isArray(p.artists) && p.artists.length > 0) {
          author = p.artists.map((a: any) => a.name).filter(Boolean).join(", ");
        } else if (Array.isArray(p.authors) && p.authors.length > 0) {
          author = p.authors.map((a: any) => a.name).filter(Boolean).join(", ");
        } else if (p.author) {
          author = typeof p.author === "string" ? p.author : p.author.name || "";
        } else if (Array.isArray(p.subtitle?.runs)) {
          author = p.subtitle.runs.map((r: any) => r.text).join("").split("•")[0].trim();
        } else if (p.flex_columns && p.flex_columns.length > 1) {
          author = p.flex_columns[1].title?.runs?.[0]?.text || p.flex_columns[1].title?.text || "";
        }
      }

      let thumbnail = "";
      if (p.content_image?.primary_thumbnail?.image?.length > 0) {
        thumbnail = extractThumbFromList(p.content_image.primary_thumbnail.image);
      } else if (p.thumbnail?.contents?.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnail.contents);
      } else if (Array.isArray(p.thumbnail) && p.thumbnail.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnail);
      } else if (p.thumbnails?.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnails);
      } else if (typeof p.thumbnail === "string") {
        thumbnail = upgradeYtThumb(p.thumbnail);
      }

      if (!thumbnail && cleanId.length === 11) {
        thumbnail = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
      }

      const pageType = p.endpoint?.payload?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType || "";
      if (cleanId.startsWith("MPED") || pageType === "MUSIC_PAGE_TYPE_NON_MUSIC_AUDIO_TRACK_PAGE") {
        return null;
      }

      const isPlaylist =
        cleanId.startsWith("PL") ||
        cleanId.startsWith("RDCLAK") ||
        cleanId.startsWith("OLAK") ||
        cleanId.startsWith("MPRE") ||
        p.type === "Playlist" ||
        p.type === "LockupView" ||
        id.startsWith("VL") ||
        (!!p.endpoint?.payload?.browseId && p.endpoint?.payload?.browseId !== cleanId);

      if (!isPlaylist && !/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
        return null;
      }

      return {
        id: cleanId,
        title,
        artist: author || "YouTube Music",
        duration: isPlaylist ? "Playlist" : p.duration?.text || "N/A",
        url: isPlaylist
          ? `https://music.youtube.com/playlist?list=${cleanId}`
          : `https://www.youtube.com/watch?v=${cleanId}`,
        thumbnail,
        isPlaylist,
        subType: isPlaylist ? "playlist" : "cancion",
      };
    } catch (e) {
      return null;
    }
  };

  const dedupeItems = (items: any[], limit = 20) => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const item of items) {
      if (!item || !item.id || !item.title) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  };

  try {
    const currentYear = new Date().getFullYear();
    const chartCountry = country === "GLOBAL" ? "ZZ" : country;

    // Fetch live YouTube Music data in parallel
    const [
      chartsRes,
      musicExploreRes,
      topHitsSearchRes,
      viralSearchRes,
      popSearchRes,
    ] = await Promise.all<any>([
      ytCountry.actions.execute("/browse", {
        browseId: "FEmusic_charts",
        client: "YTMUSIC",
        formData: { selectedValues: [chartCountry] },
      }).catch(() => null),
      ytCountry.music.getExplore().catch(() => null),
      ytCountry.music.search(`Top Hits ${countryName} ${currentYear}`, { type: "playlist" }).catch(() => null),
      ytCountry.music.search(`Tendencias Viral ${countryName} ${currentYear}`, { type: "playlist" }).catch(() => null),
      ytCountry.music.search(`Pop Hits ${countryName}`, { type: "playlist" }).catch(() => null),
    ]);

    // 1. Parse FEmusic_charts (official country charts)
    const chartPlaylists: any[] = [];
    try {
      const contents = chartsRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
      if (contents) {
        for (const c of contents) {
          if (c.musicCarouselShelfRenderer) {
            const shelfItems = c.musicCarouselShelfRenderer.contents || [];
            shelfItems.forEach((i: any) => {
              const title =
                i.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
                i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text;
              let pid =
                i.musicResponsiveListItemRenderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.playlistId ||
                i.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
              if (pid && pid.startsWith("VL")) pid = pid.replace(/^VL/, "");
              const thumbList =
                i.musicResponsiveListItemRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                i.musicTwoRowItemRenderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
              const thumbnail = extractThumbFromList(thumbList || []);
              if (pid && title && (pid.startsWith("PL") || pid.startsWith("OLAK") || pid.startsWith("RDCLAK"))) {
                chartPlaylists.push({
                  id: pid,
                  title,
                  artist: "YouTube Music",
                  duration: "Playlist",
                  url: `https://music.youtube.com/playlist?list=${pid}`,
                  thumbnail,
                  isPlaylist: true,
                  subType: "playlist",
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.error("Charts parse error:", e);
    }

    // 2. Parse yt.music.getExplore() live sections (New albums & singles, Trending, New music videos, Moods & genres)
    let newAlbumsAndSingles: any[] = [];
    let liveTrendingTracks: any[] = [];
    let liveMusicVideos: any[] = [];
    let moodPlaylists: any[] = [];

    if (musicExploreRes?.sections) {
      for (const sec of musicExploreRes.sections) {
        const secTitle = (sec.header?.title?.text || sec.title?.text || "").toLowerCase();
        if (secTitle.includes("new albums") || secTitle.includes("álbumes") || secTitle.includes("novedades")) {
          newAlbumsAndSingles = (sec.contents || []).map(parseInnertubeItem).filter(Boolean);
        } else if (secTitle.includes("trending") || secTitle.includes("tendencias")) {
          liveTrendingTracks = (sec.contents || []).map(parseInnertubeItem).filter(Boolean);
        } else if (secTitle.includes("music videos") || secTitle.includes("vídeos") || secTitle.includes("videos")) {
          liveMusicVideos = (sec.contents || []).map(parseInnertubeItem).filter(Boolean);
        } else if (secTitle.includes("moods") || secTitle.includes("géneros") || secTitle.includes("estados")) {
          // Fetch live official RDCLAK5uy_ playlists from the first 2 mood/genre categories
          const navButtons = (sec.contents || []).filter((m: any) => m.endpoint?.payload?.params).slice(0, 2);
          try {
            const catResponses = await Promise.all(
              navButtons.map((btn: any) =>
                ytCountry.actions.execute("/browse", {
                  browseId: "FEmusic_moods_and_genres_category",
                  client: "YTMUSIC",
                  params: btn.endpoint.payload.params,
                }).catch(() => null),
              ),
            );
            for (const catRes of catResponses) {
              const shelves = catRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
              for (const sh of shelves.slice(0, 2)) {
                const shelfItems = sh.musicCarouselShelfRenderer?.contents || [];
                for (const item of shelfItems) {
                  const renderer = item.musicTwoRowItemRenderer;
                  if (!renderer) continue;
                  const title = renderer.title?.runs?.[0]?.text;
                  let pid = renderer.navigationEndpoint?.browseEndpoint?.browseId || "";
                  if (pid.startsWith("VL")) pid = pid.replace(/^VL/, "");
                  const thumb = extractThumbFromList(renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || []);
                  const subtitle = renderer.subtitle?.runs?.map((r: any) => r.text).join("") || "YouTube Music";
                  if (pid && title) {
                    moodPlaylists.push({
                      id: pid,
                      title,
                      artist: subtitle.split("•")[0].trim() || "YouTube Music",
                      duration: "Playlist",
                      url: `https://music.youtube.com/playlist?list=${pid}`,
                      thumbnail: thumb,
                      isPlaylist: true,
                      subType: "playlist",
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Moods fetch error:", e);
          }
        }
      }
    }

    // 3. Parse yt.music.search playlist results
    const extractMusicSearchPlaylists = (searchRes: any) => {
      const raw = searchRes?.contents?.[0]?.contents || searchRes?.results || [];
      return raw.map(parseInnertubeItem).filter((p: any) => p && p.isPlaylist);
    };

    const topHitsList = extractMusicSearchPlaylists(topHitsSearchRes);
    const viralList = extractMusicSearchPlaylists(viralSearchRes);
    const popList = extractMusicSearchPlaylists(popSearchRes);

    // 4. Assemble distinct, fresh YouTube Music arrays for every Explore section
    const mixParaTi = dedupeItems([...moodPlaylists, ...chartPlaylists], 20);
    const top100 = dedupeItems([...chartPlaylists, ...topHitsList], 20);
    const top20Tendencias = dedupeItems([...viralList, ...topHitsList.slice(5)], 20);
    const dailyTopPlaylists = dedupeItems(newAlbumsAndSingles.length > 0 ? newAlbumsAndSingles : topHitsList, 24);
    const dailyTop = dedupeItems(liveMusicVideos.length > 0 ? liveMusicVideos : liveTrendingTracks, 24);
    const trending = dedupeItems(liveTrendingTracks.length > 0 ? liveTrendingTracks : [...chartPlaylists, ...newAlbumsAndSingles], 20);
    const pop = dedupeItems([...popList, ...moodPlaylists.filter((m) => m.title.toLowerCase().includes("pop") || m.title.toLowerCase().includes("hits"))], 20);

    const data = {
      mixParaTi: mixParaTi.length > 0 ? mixParaTi : top100,
      top100,
      top20Tendencias: top20Tendencias.length > 0 ? top20Tendencias : top100,
      dailyTopPlaylists: dailyTopPlaylists.length > 0 ? dailyTopPlaylists : top100,
      dailyTop: dailyTop.length > 0 ? dailyTop : trending,
      trending: trending.length > 0 ? trending : top100,
      pop: pop.length > 0 ? pop : moodPlaylists,
    };

    exploreCache.set(country, { data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.warn(
      "Explore failed (likely blocked IP). Initiating Plan B (Piped API Fallback)...",
      error,
    );

    try {
      for (const instance of PIPED_INSTANCES) {
        try {
          const pRes = await fetch(`${instance}/trending?region=${country}`);
          if (pRes.ok) {
            const pData = (await pRes.json()) as any;
            const trends: any[] = [];
            (pData || []).forEach((item: any) => {
              if (item.type === "stream") {
                trends.push({
                  id: item.url.replace("/watch?v=", ""),
                  title: item.title,
                  artist: item.uploaderName || "Piped User",
                  duration:
                    item.duration > 0
                      ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, "0")}`
                      : "N/A",
                  url: `https://www.youtube.com${item.url}`,
                  thumbnail:
                    item.thumbnail ||
                    `https://i.ytimg.com/vi/${item.url.replace("/watch?v=", "")}/mqdefault.jpg`,
                  isPlaylist: false,
                  subType: item.title.toLowerCase().includes("mix")
                    ? "mix"
                    : "cancion",
                });
              }
            });

            if (trends.length > 0) {
              const data = {
                trending: trends.slice(0, 10),
                dailyTop: trends.slice(10, 20),
                top100: trends.slice(20, 30),
                top20Tendencias: trends.slice(30, 40),
                dailyTopPlaylists: trends.slice(40, 50),
                mixParaTi: trends.slice(0, 10),
                pop: trends.slice(20, 30),
              };
              exploreCache.set(country, { data, timestamp: Date.now() });
              return res.json(data);
            }
          }
        } catch (e) {
          // ignore instance fail
        }
      }
    } catch (fetchErr) {
      console.error("Explore fallback failed.");
    }

    res.status(500).json({ error: "Internal error (and fallbacks failed)" });
  }
});

// Playlist Cache (30 min TTL so YouTube Music updates propagate rapidly)
const playlistCache = new Map<string, { data: any; timestamp: number }>();
const PLAYLIST_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Playlist Info Cache
const playlistInfoCache = new Map<string, { data: any; timestamp: number }>();


app.get("/api/youtube/artist", async (req, res) => {
  const browseId = req.query.id as string;
  if (!browseId) return res.status(400).json({ error: "Missing browseId" });

  res.setHeader("Cache-Control", "public, max-age=86400");
  const cacheKey = `artist_${browseId}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  if (!yt) {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    const artist = await yt.music.getArtist(browseId);
    const sections = artist.sections?.map((s: any) => {
      return {
        title: s.header?.title?.text || s.title?.text || "",
        items: s.contents?.map(c => {
          const typeLower = c.type.toLowerCase();
          const isPlaylistType = c.endpoint?.payload?.playlistId || c.endpoint?.payload?.browseId?.startsWith('VL');
          
          let thumbnail = "";
          if (c.thumbnails && c.thumbnails.length > 0) {
             thumbnail = c.thumbnails[c.thumbnails.length - 1].url;
          }

          let videoCountStr = "";
          let author = "";
          if (c.subtitle && c.subtitle.runs) {
             author = c.subtitle.runs.map((r: any) => r.text).join("");
          }

          return {
            id: c.id || c.endpoint?.payload?.browseId || c.endpoint?.payload?.playlistId,
            title: c.title?.text || c.name?.text || "",
            type: c.type,
            isPlaylist: !!isPlaylistType,
            thumbnail: thumbnail,
            artist: author,
            duration: "",
            subType: isPlaylistType ? "playlist" : "cancion",
            url: `https://www.youtube.com/watch?v=${c.id}`
          }
        }).slice(0, 15) // take up to 15 items per section
      }
    }).filter(s => s.title && s.items && s.items.length > 0);
    
    const result = {
      header: artist.header?.title?.text,
      sections: sections
    };

    searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch artist details" });
  }
});


app.get("/api/youtube/upnext", async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  if (!yt) {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    const upNext = await yt.music.getUpNext(videoId);
    if (!upNext || !upNext.contents) {
      return res.json([]);
    }
    
    const items = upNext.contents.filter((c: any) => c.video_id).map((c: any) => {
       let durationStr = c.duration?.text || "";
       if (!durationStr && c.duration?.seconds) {
          const min = Math.floor(c.duration.seconds / 60);
          const sec = c.duration.seconds % 60;
          durationStr = `${min}:${sec.toString().padStart(2, '0')}`;
       }
       
       let thumbnail = "";
       if (c.thumbnail && c.thumbnail.length > 0) {
          thumbnail = c.thumbnail[c.thumbnail.length - 1].url;
       }

       return {
          id: 'yt_temp_' + c.video_id,
          title: c.title?.text || "",
          artist: c.author || c.artists?.map((a: any) => a.name).join(", ") || "",
          duration: durationStr,
          thumbnail: thumbnail,
          url: `https://www.youtube.com/watch?v=${c.video_id}`,
          isPlaylist: false,
          subType: "cancion",
          bpm: 120
       };
    });

    res.json(items);
  } catch (error) {
    console.error("UpNext error:", error);
    res.status(500).json({ error: "Failed to fetch up next" });
  }
});

app.get("/api/youtube/video-info", async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing video ID" });

  if (!yt) {
    try {
      yt = await Innertube.create();
    } catch (e) {
      console.error("Innertube create error:", e);
    }
  }

  try {
    if (yt) {
      try {
        const info = await yt.getBasicInfo(videoId);
        if (info && info.basic_info) {
          const vInfo = {
            id: videoId,
            title: info.basic_info.title || "Video Recomendado",
            thumbnail:
              info.basic_info.thumbnail && info.basic_info.thumbnail.length > 0
                ? info.basic_info.thumbnail[0].url
                : `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            artist: info.basic_info.channel?.name || "YouTube",
          };
          return res.json(vInfo);
        }
      } catch (err) {
        console.warn("Innertube getBasicInfo failed:", err);
      }
    }

    for (const instance of PIPED_INSTANCES) {
      try {
        const pRes = await fetch(`${instance}/streams/${videoId}`);
        if (pRes.ok) {
          const pData = (await pRes.json()) as any;
          const vInfo = {
            id: videoId,
            title: pData.title || "Video Recomendado",
            thumbnail:
              pData.thumbnailUrl ||
              `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            artist: pData.uploader || "YouTube",
          };
          return res.json(vInfo);
        }
      } catch (err) {
        // Try next instance
      }
    }
    // Final fallback
    const fallbackInfo = {
      id: videoId,
      title: "Video Personalizado",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      artist: "YouTube",
    };
    return res.json(fallbackInfo);
  } catch (error: any) {
    console.error("Error fetching video info:", error);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

const safeText = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val === "[object Object]" ? "" : val;
  if (typeof val.text === "string") return val.text;
  if (Array.isArray(val.runs)) return val.runs.map((r: any) => r.text || "").join("");
  if (typeof val.toString === "function") {
    const s = val.toString();
    return s === "[object Object]" ? "" : s;
  }
  return "";
};

async function fetchLivePlaylistInfo(playlistId: string, forceRefresh = false) {
  const cleanId = playlistId.replace(/^VL/, "");
  const cached = playlistInfoCache.get(cleanId);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < PLAYLIST_CACHE_TTL) {
    return cached.data;
  }

  if (!yt) {
    try {
      yt = await Innertube.create();
    } catch (e) {
      console.error("Innertube create error:", e);
    }
  }

  if (yt) {
    try {
      let title = "";
      let thumbnail = "";
      let artist = "";
      let trackCount = 0;
      let description = "";

      if (cleanId.startsWith("MPRE")) {
        const album = await yt.music.getAlbum(cleanId);
        if (album && album.header) {
          const head = album.header as any;
          title = safeText(head.title) || "Álbum Recomendado";
          artist = safeText(head.author?.name || head.author || head.artist?.name) || "YouTube Music";
          const thumbs = head.thumbnails || head.thumbnail?.contents || [];
          thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || "";
          trackCount = Number(head.song_count || head.item_count || head.tracks_count || album.contents?.length || 0);
          description = safeText(head.description) || safeText(head.second_subtitle);
        }
      } else if (cleanId.startsWith("RDCLAK") || cleanId.startsWith("OLAK")) {
        try {
          const mPlaylist = await yt.music.getPlaylist(cleanId);
          if (mPlaylist) {
            const head = (mPlaylist.header || {}) as any;
            title = safeText(head.title) || "Lista Recomendada";
            artist = safeText(head.author?.name || head.author || head.strapline_text_one) || "YouTube Music";
            const thumbs = head.thumbnail?.contents || head.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || "";
            const mItems = (mPlaylist as any).items || (mPlaylist as any).contents || [];
            trackCount = Number(head.song_count || head.item_count || head.tracks_count || mItems.length || 0);
            description = safeText(head.description) || safeText(head.second_subtitle);
            if (!thumbnail && mItems.length > 0) {
              const firstVid = mItems[0]?.id || mItems[0]?.video_id || mItems[0]?.endpoint?.payload?.videoId;
              if (firstVid) thumbnail = `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg`;
            }
          }
        } catch (e) {
          const playlist = await yt.getPlaylist(cleanId);
          if (playlist && playlist.info) {
            const info = playlist.info as any;
            title = safeText(info.title) || "Lista Recomendada";
            artist = safeText(info.author?.name || info.author) || "YouTube Music";
            const thumbs = info.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || "";
            trackCount = Number(info.total_items || info.video_count || playlist.items?.length || 0);
            description = safeText(info.description);
          }
        }
      } else {
        try {
          const playlist = await yt.getPlaylist(cleanId);
          if (playlist && playlist.info) {
            const info = playlist.info as any;
            title = safeText(info.title) || "Lista Recomendada";
            artist = safeText(info.author?.name || info.author) || "YouTube Music";
            const thumbs = info.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || "";
            trackCount = Number(info.total_items || info.video_count || playlist.items?.length || 0);
            description = safeText(info.description);
          }
        } catch (e) {
          const mPlaylist = await yt.music.getPlaylist(cleanId);
          if (mPlaylist && mPlaylist.header) {
            const head = mPlaylist.header as any;
            title = safeText(head.title) || "Lista Recomendada";
            artist = safeText(head.author?.name || head.author || head.strapline_text_one) || "YouTube Music";
            const thumbs = head.thumbnail?.contents || head.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || "";
            const mItems = (mPlaylist as any).items || (mPlaylist as any).contents || [];
            trackCount = Number(head.song_count || head.item_count || head.tracks_count || mItems.length || 0);
            description = safeText(head.description) || safeText(head.second_subtitle);
          }
        }
      }

      thumbnail = upgradeYtThumb(thumbnail);
      const cleanArtist = artist && artist !== "N/A" ? artist : "YouTube Music";

      if (title || thumbnail) {
        const info = {
          id: cleanId,
          title: title || "Lista Recomendada",
          thumbnail,
          artist: cleanArtist,
          trackCount,
          description: description || (trackCount ? `${trackCount} canciones` : "Playlist oficial de YouTube Music"),
        };
        playlistInfoCache.set(cleanId, { data: info, timestamp: Date.now() });
        return info;
      }
    } catch (err: any) {
      console.log(`Innertube getPlaylist info failed for ${cleanId}`);
    }
  }

  for (const instance of PIPED_INSTANCES) {
    try {
      const pRes = await fetch(`${instance}/playlists/${cleanId}`);
      if (pRes.ok) {
        const pData = (await pRes.json()) as any;
        let thumb = pData.thumbnailUrl || "";
        if (!thumb && pData.relatedStreams && pData.relatedStreams.length > 0) {
          const firstVid = pData.relatedStreams[0].url.replace("/watch?v=", "");
          thumb = `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg`;
        }
        thumb = upgradeYtThumb(thumb);
        const tCount = pData.relatedStreams?.length || pData.videos || 0;
        const info = {
          id: cleanId,
          title: pData.name || "Lista Recomendada",
          thumbnail: thumb,
          artist: pData.uploader || pData.uploaderName || "YouTube Music",
          trackCount: tCount,
          description: pData.description || (tCount ? `${tCount} canciones` : "Playlist de YouTube Music"),
        };
        playlistInfoCache.set(cleanId, { data: info, timestamp: Date.now() });
        return info;
      }
    } catch (err) {
      // Try next instance
    }
  }

  return null;
}

app.post("/api/youtube/sync-explore-playlists", async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.json([]);

    const results: any[] = new Array(items.length);
    const BATCH_SIZE = 5;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item: any, idx: number) => {
          const targetIdx = i + idx;
          if (!item || !item.id || item.isPlaylist === false) {
            results[targetIdx] = item;
            return;
          }
          const isYtPlaylist =
            item.id.startsWith("RDCLAK") ||
            item.id.startsWith("OLAK") ||
            item.id.startsWith("PL") ||
            item.id.startsWith("MPRE") ||
            item.id.startsWith("VL");
          if (!isYtPlaylist) {
            results[targetIdx] = item;
            return;
          }

          try {
            const liveInfo = await fetchLivePlaylistInfo(item.id);
            if (!liveInfo) {
              results[targetIdx] = item;
              return;
            }
            const existingThumb = item.thumbnail || "";
            const isBrokenOrExpiringThumb =
              !existingThumb || existingThumb.includes("i9.ytimg.com/s_p/");
            results[targetIdx] = {
              ...item,
              title: liveInfo.title || item.title,
              artist: liveInfo.artist || item.artist,
              trackCount: liveInfo.trackCount > 0 ? liveInfo.trackCount : item.trackCount,
              description: liveInfo.description || item.description,
              thumbnail: isBrokenOrExpiringThumb
                ? (liveInfo.thumbnail || existingThumb)
                : existingThumb,
            };
          } catch {
            results[targetIdx] = item;
          }
        }),
      );
    }

    res.json(results);
  } catch (err) {
    console.error("Sync explore playlists error:", err);
    res.status(500).json({ error: "Failed to sync explore playlists" });
  }
});

app.get("/api/youtube/playlist-info", async (req, res) => {
  const playlistId = req.query.id as string;
  if (!playlistId)
    return res.status(400).json({ error: "Missing playlist ID" });

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  const forceRefresh = req.query.refresh === "1";

  try {
    const info = await fetchLivePlaylistInfo(playlistId, forceRefresh);
    if (info) return res.json(info);

    // Final fallback: return default info instead of throwing 500 so the user can still save it
    const fallbackInfo = {
      id: playlistId,
      title: "Lista Personalizada",
      thumbnail: `https://i.ytimg.com/vi/${playlistId}/hqdefault.jpg`,
      artist: "YouTube Music",
      trackCount: 0,
      description: "Playlist de YouTube Music",
    };
    return res.json(fallbackInfo);
  } catch (err) {
    console.error("Playlist info fetch error:", err);
    return res.json({
      id: playlistId,
      title: "Lista Personalizada",
      thumbnail: "",
      artist: "YouTube Music",
      trackCount: 0,
      description: "Playlist de YouTube Music",
    });
  }
});

// YouTube Playlist Tracks Extractor Endpoint
app.get("/api/youtube/playlist", async (req, res) => {
  const playlistId = (req.query.id as string || "").replace(/^VL/, "");
  const titleFallback = req.query.title as string;
  const forceRefresh = req.query.refresh === "1";
  if (!playlistId)
    return res.status(400).json({ error: "Missing playlist ID" });

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

  const cacheKey = playlistId;
  const cached = playlistCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < PLAYLIST_CACHE_TTL) {
    return res.json(cached.data);
  }

  if (!yt) {
    try {
      yt = await Innertube.create();
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    let playlist: any;
    let rawVideos: any[] = [];

    if (playlistId.startsWith("MPRE")) {
      playlist = await yt.music.getAlbum(playlistId);
      if (playlist.contents) {
        rawVideos = Array.isArray(playlist.contents) ? playlist.contents : [];
      }
    } else if (playlistId.startsWith("RDCLAK") || playlistId.startsWith("OLAK")) {
      // YouTube Music dynamic playlists: query music.getPlaylist FIRST for live tracks
      try {
        const musicPlaylist = await yt.music.getPlaylist(playlistId);
        if (musicPlaylist) {
          playlist = musicPlaylist;
          if (musicPlaylist.items && Array.isArray(musicPlaylist.items)) {
            rawVideos.push(...musicPlaylist.items);
          }
          if (musicPlaylist.contents && Array.isArray(musicPlaylist.contents)) {
            musicPlaylist.contents.forEach((item: any) => {
              if (item && !rawVideos.includes(item)) rawVideos.push(item);
            });
          }
          if ((musicPlaylist as any).content) {
            const pitems =
              (musicPlaylist as any).content.items ||
              (musicPlaylist as any).content.contents ||
              [];
            if (Array.isArray(pitems)) {
              pitems.forEach((item: any) => {
                if (item && !rawVideos.includes(item)) rawVideos.push(item);
              });
            }
          }
        }
      } catch (err: any) {
        console.log(`[API PL] music.getPlaylist failed for ${playlistId}, trying standard getPlaylist...`);
      }

      if (rawVideos.length === 0) {
        try {
          playlist = await yt.getPlaylist(playlistId);
          if (playlist.items && Array.isArray(playlist.items)) rawVideos.push(...playlist.items);
          if (playlist.videos && Array.isArray(playlist.videos)) rawVideos.push(...playlist.videos);
        } catch (err: any) {
          console.log(`[API PL] standard getPlaylist fallback failed for ${playlistId}`);
        }
      }
    } else {
      try {
        console.log(
          `[API PL] Fetching via standard getPlaylist for: ${playlistId}`,
        );
        playlist = await yt.getPlaylist(playlistId);

        // Extract any videos/items
        if (playlist.items && Array.isArray(playlist.items)) {
          rawVideos.push(...playlist.items);
        }
        if (playlist.videos) {
          if (Array.isArray(playlist.videos)) {
            rawVideos.push(...playlist.videos);
          } else {
            const innerContents =
              playlist.videos.contents || playlist.videos.entries || [];
            if (Array.isArray(innerContents)) {
              rawVideos.push(...innerContents);
            }
          }
        }
        if (playlist.contents && Array.isArray(playlist.contents)) {
          playlist.contents.forEach((item: any) => {
            if (item && !rawVideos.includes(item)) rawVideos.push(item);
          });
        }
      } catch (err: any) {
        console.log(
          `[API PL] Standard getPlaylist not available (or private) for ${playlistId}. Checking other endpoints...`,
        );
      }

      // Fallback 1: Try YouTube Music Playlist
      if (rawVideos.length === 0) {
        try {
          console.log(
            `[API PL] Trying music.getPlaylist fallback for: ${playlistId}`,
          );
          const musicPlaylist = await yt.music.getPlaylist(playlistId);
          if (musicPlaylist) {
            playlist = musicPlaylist;
            if (musicPlaylist.items && Array.isArray(musicPlaylist.items)) {
              rawVideos.push(...musicPlaylist.items);
            }
            if (
              musicPlaylist.contents &&
              Array.isArray(musicPlaylist.contents)
            ) {
              musicPlaylist.contents.forEach((item: any) => {
                if (item && !rawVideos.includes(item)) rawVideos.push(item);
              });
            }
            if ((musicPlaylist as any).content) {
              const pitems =
                (musicPlaylist as any).content.items ||
                (musicPlaylist as any).content.contents ||
                [];
              if (Array.isArray(pitems)) {
                pitems.forEach((item: any) => {
                  if (item && !rawVideos.includes(item)) rawVideos.push(item);
                });
              }
            }
          }
        } catch (err: any) {
          console.log(
            `[API PL] music.getPlaylist not available for ${playlistId}`,
          );
        }
      }

      // Fallback 2: Try YouTube Music Album in case it was labeled as a playlist
      if (rawVideos.length === 0) {
        try {
          console.log(
            `[API PL] Trying music.getAlbum fallback for: ${playlistId}`,
          );
          const album = await yt.music.getAlbum(playlistId);
          if (album && album.contents && Array.isArray(album.contents)) {
            playlist = album;
            rawVideos.push(...album.contents);
          }
        } catch (err: any) {
          console.log(
            `[API PL] music.getAlbum not available for ${playlistId}`,
          );
        }
      }

      // Fallback 3: Search fallback by title
      if (rawVideos.length === 0 && titleFallback) {
        console.log(
          "[API PL] All fetch approaches empty. Falling back to search for:",
          titleFallback,
        );
        const searchRes = await yt.music.search(titleFallback, {
          type: "song",
        });
        if (searchRes && searchRes.contents && searchRes.contents.length > 0) {
          const firstSection = searchRes.contents[0];
          if (firstSection && firstSection.contents) {
            rawVideos = firstSection.contents;
          } else if ((searchRes as any).results) {
            rawVideos = (searchRes as any).results;
          }
        }
      }
    }

    console.log(`[API PL] rawVideos length: ${rawVideos.length}`);

    const tracks = rawVideos
      .map((v: any) => {
        try {
          const title =
            v.title?.text || v.title?.toString() || v.name || "Untitled Track";

          let artist = "YouTube Music";
          if (Array.isArray(v.artists) && v.artists.length > 0) {
            artist = v.artists.map((a: any) => a.name).join(", ");
          } else if (Array.isArray(v.authors) && v.authors.length > 0) {
            artist = v.authors.map((a: any) => a.name).join(", ");
          } else if (v.author?.name || typeof v.author === "string") {
            artist = v.author?.name || v.author?.toString();
          } else if (playlist?.author?.name) {
            artist = playlist.author.name;
          }

          const duration =
            v.duration?.text ||
            v.duration?.toString() ||
            v.length?.text ||
            v.length_text?.text ||
            "N/A";
          const id =
            v.id ||
            v.video_id ||
            v.videoId ||
            v.content_id ||
            v.endpoint?.payload?.videoId ||
            "";

          let thumbnail = "";
          if (
            v.thumbnails &&
            Array.isArray(v.thumbnails) &&
            v.thumbnails.length > 0
          ) {
            thumbnail = v.thumbnails[0].url || "";
          } else if (
            v.thumbnail &&
            v.thumbnail.thumbnails &&
            Array.isArray(v.thumbnail.thumbnails) &&
            v.thumbnail.thumbnails.length > 0
          ) {
            thumbnail = v.thumbnail.thumbnails[0].url || "";
          } else if (v.thumbnail_url) {
            thumbnail = v.thumbnail_url;
          }

          if (id && title) {
            return {
              id,
              title,
              artist,
              duration,
              url: `https://www.youtube.com/watch?v=${id}`,
              thumbnail:
                thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            };
          }
        } catch (err) {
          return null;
        }
        return null;
      })
      .filter(Boolean);

    playlistCache.set(cacheKey, { data: tracks, timestamp: Date.now() });
    res.json(tracks);
  } catch (err) {
    console.warn(
      "Error fetching playlist tracks: (likely blocked IP). Initiating Plan B (Piped API Fallback)...",
      err,
    );

    try {
      for (const instance of PIPED_INSTANCES) {
        try {
          const pRes = await fetch(`${instance}/playlists/${playlistId}`);
          if (pRes.ok) {
            const pData = (await pRes.json()) as any;
            const tracks: any[] = [];
            (pData.relatedStreams || []).forEach((item: any) => {
              if (item.url) {
                tracks.push({
                  id: item.url.replace("/watch?v=", ""),
                  title: item.title,
                  artist: item.uploaderName || "Piped User",
                  duration:
                    item.duration > 0
                      ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, "0")}`
                      : "N/A",
                  url: `https://www.youtube.com${item.url}`,
                  thumbnail:
                    item.thumbnail ||
                    `https://i.ytimg.com/vi/${item.url.replace("/watch?v=", "")}/mqdefault.jpg`,
                });
              }
            });
            if (tracks.length > 0) {
              playlistCache.set(cacheKey, {
                data: tracks,
                timestamp: Date.now(),
              });
              return res.json(tracks);
            }
          }
        } catch (e) {
          // ignore instance
        }
      }
    } catch (fetchErr) {
      console.error("Playlist fallback failed.");
    }

    res.status(500).json({
      error: "Internal error fetching playlist (and fallbacks failed)",
    });
  }
});

// Helper function to extract tracks from SoundCloud HTML
function parseSoundCloudTracks(
  html: string,
): Array<{ id: string; title: string; artist: string; url: string }> {
  try {
    // Attempt 1: Parse application/ld+json Structured Data
    const ldJsonRegex =
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = ldJsonRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1].trim());
        const processPlaylist = (obj: any) => {
          if (
            obj &&
            (obj["@type"] === "MusicPlaylist" || obj["@type"] === "ItemList") &&
            Array.isArray(obj.track || obj.itemListElement)
          ) {
            const list = obj.track || obj.itemListElement;
            const items: any[] = [];
            for (let i = 0; i < list.length; i++) {
              const item = list[i];
              const t = item.item || item;
              if (
                t &&
                (t["@type"] === "MusicRecording" ||
                  t["@type"] === "MusicVideoObject" ||
                  t.name)
              ) {
                items.push({
                  id: `sc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                  title: t.name || `Pista ${i + 1}`,
                  artist:
                    t.byArtist?.name ||
                    t.author?.name ||
                    t.creator?.name ||
                    "SoundCloud Artist",
                  url: t.url || "",
                });
              }
            }
            if (items.length > 0) return items;
          }
          return null;
        };

        if (Array.isArray(json)) {
          for (const obj of json) {
            const res = processPlaylist(obj);
            if (res) return res;
          }
        } else {
          const res = processPlaylist(json);
          if (res) return res;
        }
      } catch (e) {
        console.warn("JSON-LD parse error in scraper:", e);
      }
    }
  } catch (err) {
    console.error("LD-JSON main processing error:", err);
  }

  // Attempt 2: Fallback to regex parsing of raw HTML articles (noscript/crawler targets)
  const tracks: Array<{
    id: string;
    title: string;
    artist: string;
    url: string;
  }> = [];
  try {
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const articles = html.match(articleRegex);
    if (articles && articles.length > 0) {
      articles.forEach((art, index) => {
        const hrefRegex = /href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let lm;
        const links: Array<{ href: string; text: string }> = [];
        while ((lm = hrefRegex.exec(art)) !== null) {
          links.push({
            href: lm[1],
            text: lm[2].replace(/<[^>]*>/g, "").trim(),
          });
        }

        if (links.length >= 2) {
          const artist = links[0].text || "SoundCloud Artist";
          const title = links[1].text || "SoundCloud Track";
          const url = links[1].href.startsWith("http")
            ? links[1].href
            : `https://soundcloud.com${links[1].href}`;
          tracks.push({
            id: `sc_reg_${Date.now()}_${index}`,
            title,
            artist,
            url,
          });
        } else if (links.length === 1) {
          const title = links[0].text || "SoundCloud Track";
          const url = links[0].href.startsWith("http")
            ? links[0].href
            : `https://soundcloud.com${links[0].href}`;
          tracks.push({
            id: `sc_reg_${Date.now()}_${index}`,
            title,
            artist: "SoundCloud Artist",
            url,
          });
        }
      });
    }
  } catch (err) {
    console.error("HTML article scraper fallback error:", err);
  }

  return tracks.filter(
    (t) => t.title && t.title !== "SoundCloud" && t.title !== "SoundCloud Go",
  );
}

// Soundcloud and Youtube oEmbed Proxy to bypass CORS issues
app.get("/api/oembed", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const ytRes = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      );
      if (!ytRes.ok) {
        return res.status(ytRes.status).send(await ytRes.text());
      }
      const data = (await ytRes.json()) as any;
      return res.json({
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
        provider_name: "YouTube",
        tracks: [],
      });
    }

    const scRes = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    );
    if (!scRes.ok) {
      return res.status(scRes.status).send(await scRes.text());
    }
    const data = (await scRes.json()) as any;

    // If it's a playlist, scrape the HTML in background to enrich metadata containing actual tracks list
    if (url.includes("/sets/")) {
      try {
        console.log(`Scraping SoundCloud set URL for track names: ${url}`);
        const htmlRes = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          },
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const tracks = parseSoundCloudTracks(html);
          if (tracks && tracks.length > 0) {
            console.log(
              `Successfully scraped ${tracks.length} tracks from ${url}`,
            );
            data.tracks = tracks;
          }
        }
      } catch (scrapeErr) {
        console.error(
          "Failed to scrape set tracks in oEmbed proxy:",
          scrapeErr,
        );
      }
    }

    return res.json(data);
  } catch (error) {
    console.error("Proxy oembed error:", error);
    return res.status(500).json({ error: "Internal Fetch Error" });
  }
});

// Trial Request Notifications & Verification Endpoint
app.post("/api/trial/request", async (req, res) => {
  const { uid, email, displayName, fingerprint } = req.body;

  if (!uid || !email) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros requeridos (uid o email)" });
  }

  // Capturar la IP real del cliente
  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "IP_DESCONOCIDA";
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  console.log(
    `Solicitud de prueba recibida para ${email}. IP: ${ip}, Fingerprint: ${fingerprint}`,
  );

  // Enviar a Telegram de forma completamente gratuita si está configurado
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const text = `🔥 *Nueva Solicitud de Acceso (14 Días Gratis)*\n\n👤 *Usuario:* ${displayName || "Sin Nombre"}\n📧 *Email:* ${email}\n🆔 *UID:* ${uid}\n🌐 *IP:* ${ip}\n🖥️ *Huella:* \`${fingerprint || "N/A"}\`\n\n_Puedes concederle acceso desde el panel de administrador._`;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown",
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "Error al enviar notificación a Telegram:",
          await response.text(),
        );
      } else {
        console.log("Notificación enviada con éxito a Telegram.");
      }
    } catch (err) {
      console.error("Error al despachar notificación a Telegram:", err);
    }
  }

  return res.json({ success: true, clientIp: ip });
});

let isFirebaseAdminInitialized = false;

function getFirestoreDb() {
  if (!isFirebaseAdminInitialized) {
    try {
      const configPath = path.join(
        process.cwd(),
        "firebase-applet-config.json",
      );
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        admin.initializeApp({
          credential: process.env.FIREBASE_SERVICE_ACCOUNT ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) : admin.credential.applicationDefault(),
          projectId: config.projectId,
        });
        isFirebaseAdminInitialized = true;
      }
    } catch (e) {
      console.error("Error initializing Firebase Admin in backend:", e);
    }
  }
  if (isFirebaseAdminInitialized) {
    try {
      const configPath = path.join(
        process.cwd(),
        "firebase-applet-config.json",
      );
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const dbId = config.firestoreDatabaseId;
        if (dbId) {
          return getFirestore(dbId);
        }
      }
      return getFirestore();
    } catch (e) {
      console.error("Error getting firestore instance in backend:", e);
    }
  }
  return null;
}

let cachedTelegramConfig: { botToken: string; chatId: string } | null = null;
const CACHE_FILE_PATH = path.join(process.cwd(), "telegram_cache.json");

// Helper to load cache on startup
function loadTelegramCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, "utf-8"));
      if (data && data.botToken && data.chatId) {
        cachedTelegramConfig = data;
        console.log("Loaded cached Telegram config from disk successfully.");
      }
    }
  } catch (err) {
    console.error("Error reading Telegram cache from disk:", err);
  }
}
loadTelegramCache();

async function getTelegramConfig() {
  // 1. Try env variables first
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    return { botToken, chatId };
  }

  // 2. Try the warmed-up cache memory/file
  if (
    cachedTelegramConfig &&
    cachedTelegramConfig.botToken &&
    cachedTelegramConfig.chatId
  ) {
    return cachedTelegramConfig;
  }

  // 3. Fallback to reading file directly
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, "utf-8"));
      if (data && data.botToken && data.chatId) {
        cachedTelegramConfig = data;
        return data;
      }
    }
  } catch (e) {
    // ignore
  }

  // 4. Try Firestore via REST API (bypasses Admin SDK auth issues in preview environment)
  try {
    const configPath = path.join(
      process.cwd(),
      "firebase-applet-config.json",
    );
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const dbId = config.firestoreDatabaseId || "(default)";
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/system_settings/telegram`;
      
      const res = await fetch(url);
      if (res.ok) {
        const doc = await res.json();
        if (doc.fields && doc.fields.botToken?.stringValue && doc.fields.chatId?.stringValue) {
          const configObj = {
            botToken: doc.fields.botToken.stringValue,
            chatId: doc.fields.chatId.stringValue
          };
          
          cachedTelegramConfig = configObj;
          try {
            fs.writeFileSync(
              CACHE_FILE_PATH,
              JSON.stringify(configObj, null, 2),
              "utf-8",
            );
          } catch (writeErr) {
            console.error(
              "Failed to write to file cache during lazy fetch:",
              writeErr,
            );
          }
          return configObj;
        }
      }
    }
  } catch (err: any) {
    console.warn(
      "Notice: Firestore REST lookup failed. Using fallback settings:",
      err?.message || err,
    );
  }

  return null;
}

// Endpoint to Register/Warm-up Telegram credentials from secure Admin UI
app.post("/api/support/register-telegram", async (req, res) => {
  const { botToken, chatId, adminEmail } = req.body;

  // Enforce security check: must be from the admin email
  if (adminEmail !== "eltygere8651@gmail.com") {
    return res.status(403).json({
      error:
        "No autorizado. Solo el administrador maestro puede registrar credenciales.",
    });
  }

  if (!botToken || !chatId) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros de Telegram botToken o chatId." });
  }

  try {
    cachedTelegramConfig = {
      botToken: botToken.trim(),
      chatId: chatId.trim(),
    };

    // Save to disk cache to survive server restarts
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(cachedTelegramConfig, null, 2),
      "utf-8",
    );
    console.log("Cached Telegram credentials registered and saved to disk.");
    return res.json({
      success: true,
      message:
        "Configuración de Telegram guardada y sincronizada correctamente en el servidor.",
    });
  } catch (err: any) {
    console.error("Error saving Telegram cache:", err);
    return res
      .status(500)
      .json({ error: "Error al guardar el caché de Telegram en el servidor" });
  }
});

function escapeTelegramHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Telegram Support Message Endpoint
app.post("/api/support/telegram", async (req, res) => {
  const { userEmail, userName, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío" });
  }

  try {
    const config = await getTelegramConfig();
    if (!config || !config.botToken || !config.chatId) {
      return res.status(503).json({
        error: "El soporte por Telegram no está configurado en este momento",
      });
    }

    const title = `🚨 Nuevo Mensaje de Soporte 🚨`;
    const userLine = `👤 Usuario: ${userName || "Anónimo"} (${userEmail || "Sin email"})`;
    const messageLine = `💬 Mensaje:\n${message.trim()}`;
    const text = `${title}\n\n${userLine}\n\n${messageLine}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: text,
        }),
      },
    );

    if (!tgRes.ok) {
      const errorText = await tgRes.text();
      console.error("Error from Telegram support message API:", errorText);
      return res
        .status(502)
        .json({ error: "No se pudo entregar el mensaje al bot de Telegram" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Telegram support API error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});


  // Telegram Trial Request Endpoint
app.post("/api/support/telegram-trial", async (req, res) => {
  const { userEmail, userName, botTokenOverride, chatIdOverride } = req.body;
  try {
    const config =
      botTokenOverride && chatIdOverride
        ? { botToken: botTokenOverride, chatId: chatIdOverride }
        : await getTelegramConfig();
    if (!config || !config.botToken || !config.chatId) {
      return res.status(503).json({
        error: "El soporte por Telegram no está configurado en este momento",
      });
    }

    const title = `🎁 Nueva Solicitud de Prueba de 7 Días 🎁`;
    const text = `${title}\n\n👤 Usuario: ${userName || "Socio Premium"}\n📧 Email: ${userEmail || "Sin email"}\n\n🔔 Accede al panel de administración para aprobar el acceso al usuario al instante.`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: text,
        }),
      },
    );

    if (!tgRes.ok) {
      console.error(
        "Error from Telegram trial message API:",
        await tgRes.text(),
      );
      return res
        .status(502)
        .json({ error: "No se pudo entregar el mensaje al bot de Telegram" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Telegram trial API error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// System Health API (Admin Monitor)
app.get("/api/system/health", async (req, res) => {
  let mainLibraryStatus = "unknown";
  let planBStatus = "unknown";

  // Check Main Library (Innertube)
  try {
    const checkYT = async () => {
      if (!yt) {
        yt = await Innertube.create({ generate_session_locally: true });
      }
      const searchRes = await yt.search("lofi", { type: "video" });
      if (searchRes && searchRes.results && searchRes.results.length > 0) {
        return "online";
      } else {
        return "error";
      }
    };

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 6000),
    );
    mainLibraryStatus = await Promise.race([checkYT(), timeoutPromise]);
  } catch (e) {
    console.error("Health check main library error:", e);
    mainLibraryStatus = "offline";
  }

  // Check Plan B (Piped)
  planBStatus = "offline";
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout
      const response = await fetch(`${instance}/trending?region=US`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        planBStatus = "online";
        break; // found one working
      }
    } catch (e) {
      // try next
    }
  }

  res.json({
    mainLibrary: mainLibraryStatus,
    planB: planBStatus,
    timestamp: Date.now(),
  });
});

app.delete("/api/admin/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const adminEmail = req.headers["x-admin-email"];
  
  if (adminEmail !== "eltygere8651@gmail.com") {
    return res.status(403).json({ error: "No autorizado. Solo el administrador puede borrar usuarios." });
  }

  try {
    const db = getFirestoreDb(); // ensure admin is initialized
    // In AI Studio, we don't have admin access to the user's Firebase Auth project
    // We only delete the user from Firestore. The client will automatically sign them out
    // when it detects the user document is deleted.
    if (db) {
      let foundHash = null;
      const userDoc = await db.collection("users").doc(userId).get().catch(() => null);
      if (userDoc && userDoc.exists) {
         const data = userDoc.data();
         if (data && data.deviceHash) foundHash = data.deviceHash;
      }
      
      const vipActDoc = await db.collection("vip_activations").doc(userId).get().catch(() => null);
      if (vipActDoc && vipActDoc.exists) {
         const data = vipActDoc.data();
         if (data && data.deviceHash) foundHash = data.deviceHash;
      }

      if (foundHash) {
          // Expire the device trial instead of deleting it, so they don't get a new one
          await db.collection("vip_devices").doc(foundHash).update({ activatedAt: 0 }).catch(() => {});
      }
      await db.collection("users").doc(userId).delete().catch(() => {});
      await db.collection("trial_requests").doc(userId).delete().catch(() => {});
      await db.collection("vip_activations").doc(userId).delete().catch(() => {});
    }
    return res.json({ success: true, message: "Usuario borrado correctamente" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: "Error interno al borrar usuario" });
  }
});

app.post("/api/vip/recover", async (req, res) => {
  const { deviceHash } = req.body;
  if (!deviceHash) {
    return res.status(400).json({ error: "Missing deviceHash" });
  }

  try {
    const db = getFirestoreDb();
    if (!db) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const docSnap = await db.collection("vip_devices").doc(deviceHash).get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: "No active trial found" });
    }
    
    const data = docSnap.data();
    if (!data || !data.uid) {
      return res.status(404).json({ error: "Invalid trial data" });
    }

    const activatedAt = data.activatedAt || 0;
    const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
    
    if (isExpired) {
      return res.status(403).json({ error: "Trial expired" });
    }

    const customToken = await admin.auth().createCustomToken(data.uid);
    res.json({ token: customToken });
  } catch (error) {
    console.error("Recover VIP Error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
