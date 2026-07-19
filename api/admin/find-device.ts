import { getFirestoreDb } from "../../src/lib/firebase-admin";

export default async function handler(req: any, res: any) {
  console.log("POST /api/admin/find-device");
  
  // CORS setup for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminEmail = req.headers["x-admin-email"];
  const { searchTerm } = req.body;

  console.log(`[ADMIN_QA] Petición recibida en /api/admin/find-device (Serverless)`);
  console.log(`[ADMIN_QA] Admin: ${adminEmail}`);
  console.log(`[ADMIN_QA] SearchTerm: ${searchTerm}`);

  if (adminEmail !== "eltygere8651@gmail.com") {
    console.warn(`[ADMIN_QA] Intento de acceso no autorizado por ${adminEmail}`);
    return res.status(403).json({ error: "No autorizado. Solo el administrador puede utilizar esta herramienta." });
  }

  if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
    return res.status(400).json({ error: "Debe proporcionar un parámetro de búsqueda válido." });
  }

  const queryStr = searchTerm.trim();
  const db = getFirestoreDb();
  if (!db) {
    console.error(`[ADMIN_QA] Firestore no inicializado`);
    return res.status(503).json({ error: "Firebase no inicializado" });
  }

  console.log(`[ADMIN_QA] Iniciando búsqueda para: ${queryStr}`);

  try {
    // 1. Try resolving User by email or UID
    let userDoc = null;
    const uDoc = await db.collection("users").doc(queryStr).get().catch((err) => {
      console.error(`[ADMIN_QA] Error buscando usuario por ID: ${err.message}`);
      return null;
    });
    if (uDoc && uDoc.exists) {
      userDoc = uDoc;
    } else {
      const uQuery = await db.collection("users").where("email", "==", queryStr).limit(1).get().catch((err) => {
        console.error(`[ADMIN_QA] Error buscando usuario por email: ${err.message}`);
        return null;
      });
      if (uQuery && !uQuery.empty) {
        userDoc = uQuery.docs[0];
      }
    }

    const foundUid = userDoc ? userDoc.id : (queryStr.startsWith("vip_") ? queryStr : null);
    const foundEmail = userDoc ? userDoc.data()?.email : (queryStr.includes("@") ? queryStr : null);
    
    console.log(`[ADMIN_QA] UID Resuelto: ${foundUid}, Email Resuelto: ${foundEmail}`);

    // 2. Devices searching
    const deviceDocs: any[] = [];
    const vipDeviceDocs: any[] = [];

    const devById = await db.collection("devices").doc(queryStr).get().catch(() => null);
    if (devById && devById.exists) deviceDocs.push(devById);

    const vipById = await db.collection("vip_devices").doc(queryStr).get().catch(() => null);
    if (vipById && vipById.exists) vipDeviceDocs.push(vipById);

    const dQuery1 = await db.collection("devices").where("deviceId", "==", queryStr).get().catch(() => null);
    if (dQuery1 && !dQuery1.empty) {
      dQuery1.forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
    }
    const dQuery2 = await db.collection("devices").where("hardwareSignature", "==", queryStr).get().catch(() => null);
    if (dQuery2 && !dQuery2.empty) {
      dQuery2.forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
    }
    if (foundUid) {
      const dQuery3 = await db.collection("devices").where("activatedByUser", "==", foundUid).get().catch(() => null);
      if (dQuery3 && !dQuery3.empty) {
        dQuery3.forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
      }
      const vQuery = await db.collection("vip_devices").where("uid", "==", foundUid).get().catch(() => null);
      if (vQuery && !vQuery.empty) {
        vQuery.forEach(d => { if (!vipDeviceDocs.some(x => x.id === d.id)) vipDeviceDocs.push(d); });
      }
    }

    const fingerprints = new Set<string>();
    const hardwareSignatures = new Set<string>();

    if (queryStr && !queryStr.includes("@") && !queryStr.startsWith("vip_") && queryStr.length > 8) {
      fingerprints.add(queryStr);
    }
    deviceDocs.forEach(d => {
      fingerprints.add(d.id);
      const hs = d.data()?.hardwareSignature;
      if (hs) hardwareSignatures.add(hs);
    });
    vipDeviceDocs.forEach(d => fingerprints.add(d.id));

    const trialRequests: any[] = [];
    const trSet = new Set<string>();
    const addTr = (doc: any) => {
      if (!trSet.has(doc.id)) {
        trSet.add(doc.id);
        trialRequests.push({ id: doc.id, ...doc.data() });
      }
    };

    if (foundUid) {
      const trDoc = await db.collection("trial_requests").doc(foundUid).get().catch(() => null);
      if (trDoc && trDoc.exists) addTr(trDoc);
      const trQuery = await db.collection("trial_requests").where("uid", "==", foundUid).get().catch(() => null);
      if (trQuery && !trQuery.empty) trQuery.forEach(addTr);
    }
    if (foundEmail) {
      const trEmailQuery = await db.collection("trial_requests").where("email", "==", foundEmail).get().catch(() => null);
      if (trEmailQuery && !trEmailQuery.empty) trEmailQuery.forEach(addTr);
    }

    const vipActivations: any[] = [];
    if (foundUid) {
      const vaDoc = await db.collection("vip_activations").doc(foundUid).get().catch(() => null);
      if (vaDoc && vaDoc.exists) vipActivations.push({ id: vaDoc.id, ...vaDoc.data() });
    }

    const device = {
      uid: userDoc?.id || foundUid || null,
      email: userDoc?.data()?.email || foundEmail || null,
      fingerprints: Array.from(fingerprints),
      hardwareSignatures: Array.from(hardwareSignatures),
      firstActivationDate: deviceDocs[0]?.data()?.createdAt || vipDeviceDocs[0]?.data()?.createdAt || null,
      status: (deviceDocs.length > 0 || trialRequests.length > 0) ? "Prueba Utilizada / Activo" : "Sin registros",
      details: {
        devicesCount: deviceDocs.length,
        vipDevicesCount: vipDeviceDocs.length,
        trialRequestsCount: trialRequests.length,
        vipActivationsCount: vipActivations.length,
        userExists: !!userDoc
      }
    };

    console.log(`[ADMIN_QA] Resumen de búsqueda finalizado. Found: ${deviceDocs.length + vipDeviceDocs.length + trialRequests.length > 0}`);

    return res.json({
      success: true,
      found: deviceDocs.length > 0 || vipDeviceDocs.length > 0 || trialRequests.length > 0 || vipActivations.length > 0 || !!userDoc,
      device
    });

  } catch (error: any) {
    console.error("Error finding device:", error);
    return res.status(500).json({ error: "Error interno al buscar el dispositivo." });
  }
}
