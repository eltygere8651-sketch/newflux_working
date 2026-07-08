const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const analyticsRoute = `app.post("/api/analytics/sync", async (req, res) => {
  try {
    const { userId, events, songs, playlists } = req.body;
    
    if (!events && !songs && !playlists) {
       return res.status(400).json({ error: 'No data provided' });
    }
    
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    const globalRef = db.collection("analytics_daily").doc(today);
    
    const updates = {};
    if (events) {
      for (const [key, val] of Object.entries(events)) {
        if (typeof val === 'number' && val > 0) {
          updates[key] = admin.firestore.FieldValue.increment(val);
        }
      }
    }
    
    if (userId && userId !== 'anonymous') {
      updates.activeUsers = admin.firestore.FieldValue.arrayUnion(userId);
    }
    
    if (Object.keys(updates).length > 0) {
      await globalRef.set(updates, { merge: true });
    }
    
    const batch = db.batch();
    let batchCount = 0;
    
    if (songs) {
      for (const [songId, data] of Object.entries(songs)) {
        if (batchCount >= 400) break;
        const docRef = db.collection("analytics_songs").doc(songId.replace(/\\//g, '_'));
        batch.set(docRef, {
          title: data.title,
          artist: data.artist || '',
          count: admin.firestore.FieldValue.increment(data.count),
          type: 'song',
          lastPlayed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        batchCount++;
      }
    }
    
    if (playlists) {
      for (const [plId, data] of Object.entries(playlists)) {
        if (batchCount >= 400) break;
        const docRef = db.collection("analytics_playlists").doc(plId.replace(/\\//g, '_'));
        batch.set(docRef, {
          title: data.title,
          count: admin.firestore.FieldValue.increment(data.count),
          type: 'playlist',
          lastPlayed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        batchCount++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Analytics sync error", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

`;

code = code.replace('app.get("/api/system/health",', analyticsRoute + 'app.get("/api/system/health",');
fs.writeFileSync('server.ts', code);
