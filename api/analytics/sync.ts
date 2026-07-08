import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, events, songs, playlists } = req.body;
    
    // Validate request body
    if (!events && !songs && !playlists) {
       return res.status(400).json({ error: 'No data provided' });
    }
    
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    const globalRef = db.collection("analytics_daily").doc(today);
    
    const updates: any = {};
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
        const docRef = db.collection("analytics_songs").doc(songId.replace(/\//g, '_'));
        batch.set(docRef, {
          title: (data as any).title,
          artist: (data as any).artist || '',
          count: admin.firestore.FieldValue.increment((data as any).count),
          type: 'song',
          lastPlayed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        batchCount++;
      }
    }
    
    if (playlists) {
      for (const [plId, data] of Object.entries(playlists)) {
        if (batchCount >= 400) break;
        const docRef = db.collection("analytics_playlists").doc(plId.replace(/\//g, '_'));
        batch.set(docRef, {
          title: (data as any).title,
          count: admin.firestore.FieldValue.increment((data as any).count),
          type: 'playlist',
          lastPlayed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        batchCount++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Analytics sync error", err);
    res.status(500).json({ error: "Sync failed" });
  }
}
