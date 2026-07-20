import { getFirestoreDb } from "../../src/lib/firebase-admin.js";

export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  console.log(`[DEBUG_TRACE] [${startTime}] Inicio del endpoint /api/admin/find-device`);

  try {
    // 0. CORS setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-email');

    if (req.method === 'OPTIONS') {
      console.log(`[DEBUG_TRACE] [${Date.now()}] Respondiendo OPTIONS`);
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log(`[DEBUG_TRACE] [${Date.now()}] Método no permitido: ${req.method}`);
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // 1. Auth check
    const adminEmail = req.headers["x-admin-email"];
    console.log(`[DEBUG_TRACE] [${Date.now()}] Usuario autenticado (header): ${adminEmail}`);

    if (adminEmail !== "eltygere8651@gmail.com") {
      console.warn(`[DEBUG_TRACE] [${Date.now()}] Acceso denegado para: ${adminEmail}`);
      return res.status(403).json({ 
        success: false, 
        error: "No autorizado. Solo el administrador puede utilizar esta herramienta.",
        details: { providedEmail: adminEmail }
      });
    }

    // 2. Body validation
    const { searchTerm } = req.body;
    console.log(`[DEBUG_TRACE] [${Date.now()}] SearchTerm: ${searchTerm}`);

    if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
      console.log(`[DEBUG_TRACE] [${Date.now()}] SearchTerm inválido`);
      return res.status(400).json({ success: false, error: "Debe proporcionar un parámetro de búsqueda válido." });
    }

    const queryStr = searchTerm.trim();

    // 3. Firebase Initialization check
    console.log(`[DEBUG_TRACE] [${Date.now()}] Llamando a getFirestoreDb()`);
    console.log(`[DEBUG_TRACE] Variables de entorno: FIREBASE_SERVICE_ACCOUNT=${!!process.env.FIREBASE_SERVICE_ACCOUNT}, GOOGLE_APPLICATION_CREDENTIALS=${!!process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    
    let db;
    try {
      db = getFirestoreDb();
    } catch (dbInitErr: any) {
      console.error(`[DEBUG_TRACE] [${Date.now()}] Excepción FATAL en getFirestoreDb():`, dbInitErr);
      return res.status(500).json({
        success: false,
        error: "Error al inicializar Firestore",
        message: dbInitErr.message,
        stack: dbInitErr.stack
      });
    }

    if (!db) {
      console.error(`[DEBUG_TRACE] [${Date.now()}] getFirestoreDb() devolvió null`);
      return res.status(503).json({ 
        success: false, 
        error: "Firebase no inicializado",
        details: "getFirestoreDb() failed to provide an instance.",
        envStatus: {
          hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
          hasGcpProject: !!process.env.GOOGLE_CLOUD_PROJECT,
          hasProjectID: !!process.env.GCP_PROJECT,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }
    console.log(`[DEBUG_TRACE] [${Date.now()}] Firestore obtenido correctamente`);

    // 4. Data fetching
    console.log(`[DEBUG_TRACE] [${Date.now()}] Iniciando queries a Firestore`);
    
    try {
      // 1. Try resolving User by email or UID
      let userDoc = null;
      console.log(`[DEBUG_TRACE] [${Date.now()}] Buscando usuario por ID/Email...`);
      
      let uDoc = null;
      try {
        if (queryStr && !queryStr.includes("/")) {
          uDoc = await db.collection("users").doc(queryStr).get().catch(() => null);
        }
      } catch (e) {
        console.error("Invalid doc path", e);
      }

      if (uDoc && uDoc.exists) {
        userDoc = uDoc;
        console.log(`[DEBUG_TRACE] [${Date.now()}] Usuario encontrado por ID`);
      } else {
        const uQuery = await db.collection("users").where("email", "==", queryStr).limit(1).get().catch((err) => {
          console.error(`[DEBUG_TRACE] [${Date.now()}] Error buscando usuario por email (${queryStr}):`, err);
          return null;
        });
        if (uQuery && !uQuery.empty) {
          userDoc = uQuery.docs[0];
          console.log(`[DEBUG_TRACE] [${Date.now()}] Usuario encontrado por Email`);
        }
      }

      const foundUid = userDoc ? userDoc.id : (queryStr.startsWith("vip_") ? queryStr : null);
      const foundEmail = userDoc ? userDoc.data()?.email : (queryStr.includes("@") ? queryStr : null);
      
      console.log(`[DEBUG_TRACE] [${Date.now()}] UID Resuelto: ${foundUid}, Email Resuelto: ${foundEmail}`);

      // 2. Devices searching
      console.log(`[DEBUG_TRACE] [${Date.now()}] Buscando dispositivos...`);
      const deviceDocs: any[] = [];
      const vipDeviceDocs: any[] = [];

      try {
        if (queryStr && !queryStr.includes("/")) {
          const devById = await db.collection("devices").doc(queryStr).get().catch(() => null);
          if (devById && devById.exists) deviceDocs.push(devById);

          const vipById = await db.collection("vip_devices").doc(queryStr).get().catch(() => null);
          if (vipById && vipById.exists) vipDeviceDocs.push(vipById);
        }
      } catch (e) {}

      const dQueries = await Promise.all([
        db.collection("devices").where("deviceId", "==", queryStr).get().catch(() => null),
        db.collection("devices").where("hardwareSignature", "==", queryStr).get().catch(() => null),
        foundUid ? db.collection("devices").where("activatedByUser", "==", foundUid).get().catch(() => null) : Promise.resolve(null),
        foundUid ? db.collection("vip_devices").where("uid", "==", foundUid).get().catch(() => null) : Promise.resolve(null)
      ]);

      if (dQueries[0] && !dQueries[0].empty) dQueries[0].forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
      if (dQueries[1] && !dQueries[1].empty) dQueries[1].forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
      if (dQueries[2] && !dQueries[2].empty) dQueries[2].forEach(d => { if (!deviceDocs.some(x => x.id === d.id)) deviceDocs.push(d); });
      if (dQueries[3] && !dQueries[3].empty) dQueries[3].forEach(d => { if (!vipDeviceDocs.some(x => x.id === d.id)) vipDeviceDocs.push(d); });

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

      console.log(`[DEBUG_TRACE] [${Date.now()}] Buscando solicitudes de prueba...`);
      const trialRequests: any[] = [];
      const trSet = new Set<string>();
      const addTr = (doc: any) => {
        if (!trSet.has(doc.id)) {
          trSet.add(doc.id);
          trialRequests.push({ id: doc.id, ...doc.data() });
        }
      };

      if (foundUid) {
        let trDoc = null;
        try {
          if (!foundUid.includes("/")) {
            trDoc = await db.collection("trial_requests").doc(foundUid).get().catch(() => null);
          }
        } catch (e) {}
        
        const trQuery = await db.collection("trial_requests").where("uid", "==", foundUid).get().catch(() => null);
        
        if (trDoc && trDoc.exists) addTr(trDoc);
        if (trQuery && !trQuery.empty) trQuery.forEach(addTr);
      }
      if (foundEmail) {
        const trEmailQuery = await db.collection("trial_requests").where("email", "==", foundEmail).get().catch(() => null);
        if (trEmailQuery && !trEmailQuery.empty) trEmailQuery.forEach(addTr);
      }

      console.log(`[DEBUG_TRACE] [${Date.now()}] Buscando activaciones VIP...`);
      const vipActivations: any[] = [];
      if (foundUid) {
        try {
          if (!foundUid.includes("/")) {
            const vaDoc = await db.collection("vip_activations").doc(foundUid).get().catch(() => null);
            if (vaDoc && vaDoc.exists) vipActivations.push({ id: vaDoc.id, ...vaDoc.data() });
          }
        } catch (e) {}
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

      console.log(`[DEBUG_TRACE] [${Date.now()}] Fin del endpoint con éxito. Tiempo: ${Date.now() - startTime}ms`);

      return res.json({
        success: true,
        found: deviceDocs.length > 0 || vipDeviceDocs.length > 0 || trialRequests.length > 0 || vipActivations.length > 0 || !!userDoc,
        device
      });

    } catch (firestoreErr: any) {
      console.error(`[DEBUG_TRACE] [${Date.now()}] Error en operaciones de Firestore:`, firestoreErr);
      return res.status(500).json({
        success: false,
        error: "Error en operaciones de Firestore",
        message: firestoreErr.message,
        code: firestoreErr.code,
        stack: firestoreErr.stack
      });
    }

  } catch (globalErr: any) {
    console.error(`[DEBUG_TRACE] [${Date.now()}] EXCEPCIÓN GLOBAL NO CONTROLADA:`, globalErr);
    return res.status(500).json({
      success: false,
      error: "Excepción global no controlada",
      message: globalErr.message,
      stack: globalErr.stack
    });
  }
}

