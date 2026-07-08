const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const replacementOld = `
// Caches for Firestore data to minimize reads globally
const communityCache = { data: null, timestamp: 0 };
const COMMUNITY_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

app.get("/api/community/playlists", async (req, res) => {
  try {
    if (communityCache.data && Date.now() - communityCache.timestamp < COMMUNITY_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.json(communityCache.data);
    }
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const snapshot = await db.collectionGroup("playlists")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
      
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
    res.status(500).json({ error: "Failed to fetch community playlists" });
  }
});

const exploreCustomCache = { data: null, timestamp: 0 };
const EXPLORE_CUSTOM_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

app.get("/api/explore/custom-playlists", async (req, res) => {
  try {
    if (exploreCustomCache.data && Date.now() - exploreCustomCache.timestamp < EXPLORE_CUSTOM_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=43200");
      return res.json(exploreCustomCache.data);
    }
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const snapshot = await db.collection("explore_custom_playlists")
      .orderBy("createdAt", "desc")
      .get();
      
    const lists = snapshot.docs.map(doc => ({
      ...doc.data(),
      docId: doc.id
    }));
    
    exploreCustomCache.data = lists;
    exploreCustomCache.timestamp = Date.now();
    
    res.setHeader("Cache-Control", "public, max-age=43200");
    return res.json(lists);
  } catch (err) {
    console.error("Error fetching custom explore playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch custom explore playlists" });
  }
});
`;

const replacementNew = `
// Caches for Firestore data to minimize reads globally
const communityCache = { data: null, timestamp: 0 };
const COMMUNITY_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
let clientDb = null;
async function getClientDb() {
  if (clientDb) return clientDb;
  const { initializeApp } = await import("firebase/app");
  const { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import("firebase/firestore");
  const configPath = require("path").join(process.cwd(), "firebase-applet-config.json");
  if (!require("fs").existsSync(configPath)) return null;
  const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
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
    res.status(500).json({ error: "Failed to fetch community playlists" });
  }
});

const exploreCustomCache = { data: null, timestamp: 0 };
const EXPLORE_CUSTOM_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

app.get("/api/explore/custom-playlists", async (req, res) => {
  try {
    if (exploreCustomCache.data && Date.now() - exploreCustomCache.timestamp < EXPLORE_CUSTOM_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=43200");
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
    
    res.setHeader("Cache-Control", "public, max-age=43200");
    return res.json(lists);
  } catch (err) {
    console.error("Error fetching custom explore playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch custom explore playlists" });
  }
});
`;

code = code.replace(replacementOld, replacementNew);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts successfully");
