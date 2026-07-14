import { getFirestore, FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uuid, deviceHash, campaignId } = req.body || {};
  
  if (!uuid || typeof uuid !== 'string' || uuid.length > 100) {
    return res.status(400).json({ error: "UUID no válido" });
  }
  if (!deviceHash || typeof deviceHash !== 'string' || deviceHash.length > 100) {
    return res.status(400).json({ error: "Hash no válido" });
  }

  try {
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        return res.status(500).json({ error: "Falta configuración de Firebase" });
      }
      
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    const db = getFirestore();

    // Anti-abuse Check (Capa 4)
    let riskScore = 0;
    
    // Check if device hash has been used before
    const hashRef = db.collection('vip_devices').doc(deviceHash);
    const hashDoc = await hashRef.get();
    
    if (hashDoc.exists) {
       const activations = hashDoc.data()?.activations || 0;
       riskScore += activations * 40;
    }

    // Rate Limiting (Capa 6) - We can use a lightweight counter for the hash
    if (riskScore >= 100) {
       return res.status(403).json({ error: "Risk score too high, trial denied." });
    }

    // Register activation
    const now = Date.now();
    await hashRef.set({ activations: FieldValue.increment(1), lastUsed: now }, { merge: true });

    const trialDoc = db.collection('vip_activations').doc(uuid);
    await trialDoc.set({
      uuid,
      deviceHash,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      version: 2,
      status: 'active',
      campaignId: campaignId || null
    });

    // Generate Custom Token
    const customToken = await admin.auth().createCustomToken(uuid, { vip: true });

    // Also pre-create the user document so they have the Premium status immediately
    await db.collection('users').doc(uuid).set({
      isVIPGuest: true,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      lastActiveAt: now,
      totalUsageTime: 0,
      plan: "free",
      trialStart: now,
      maxUsers: 1,
      originCampaign: campaignId || null,
    }, { merge: true });

    if (campaignId) {
      await db.collection('qr_campaigns').doc(campaignId).update({ vipActivations: FieldValue.increment(1) }).catch(e => console.error(e));
    }

    return res.json({ success: true, customToken });
  } catch (err) {
    console.error("Error activating VIP:", err);
    return res.status(500).json({ error: "Error interno al activar VIP" });
  }
}
