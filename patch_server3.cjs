const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const trialActivationEndpoint = `
// Trial Activation Endpoint
app.post("/api/trial/activate-vip", async (req, res) => {
  const { deviceHash, campaignId, displayName } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  
  const token = authHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const uid = decodedToken.uid;
  if (!deviceHash) {
    return res.status(400).json({ error: "Missing device hash" });
  }

  const db = getFirestoreDb();
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    await db.runTransaction(async (t) => {
      const deviceRef = db.collection("vip_devices").doc(deviceHash);
      const userRef = db.collection("users").doc(uid);
      
      const deviceSnap = await t.get(deviceRef);
      const userSnap = await t.get(userRef);

      if (deviceSnap.exists) {
        const data = deviceSnap.data();
        if (data.activatedAt !== 0 && data.uid !== uid) {
          throw new Error("Este dispositivo ya ha recibido una prueba gratuita.");
        }
      }

      if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData.trialStart || userData.plan === "free" || userData.trialUsed) {
           throw new Error("Esta cuenta ya ha disfrutado de una prueba gratuita.");
        }
      }
      
      const now = Date.now();
      
      t.set(deviceRef, {
        uid,
        activatedAt: now,
        campaignId: campaignId || null,
        displayName: displayName || 'Anonymous'
      });
      
      t.set(userRef, {
        plan: "free",
        trialStart: now,
        isVIPGuest: true,
        trialUsed: true,
        maxUsers: 1,
        deviceHash: deviceHash,
      }, { merge: true });
    });
    
    res.json({ success: true, message: "Prueba VIP activada correctamente." });
  } catch (error) {
    console.error("Trial activation error:", error);
    res.status(403).json({ error: error.message });
  }
});

`;

code = code.replace(/\/\/ Trial Request Notifications & Verification Endpoint/, trialActivationEndpoint + '// Trial Request Notifications & Verification Endpoint');

fs.writeFileSync('server.ts', code);
