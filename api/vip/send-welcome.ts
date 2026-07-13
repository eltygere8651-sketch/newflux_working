import { getFirestore, Timestamp } from "firebase-admin/firestore";
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

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || email.length > 100) {
    return res.status(400).json({ error: "Email no válido" });
  }

  try {
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        return res.status(500).json({ error: "Falta configuración de Firebase en el servidor (FIREBASE_SERVICE_ACCOUNT)" });
      }
      
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    const db = getFirestore();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Bienvenida (Inmediato)
    await db.collection("mail").add({
      to: email,
      message: {
        subject: "¡Bienvenido a Flux Premium!",
        html: `
          <div style="font-family: sans-serif; background-color: #070708; padding: 40px; color: white;">
            <h1 style="color: #1ED760;">¡Pase VIP Activado!</h1>
            <p style="color: #a7a7a7;">Disfruta de música ilimitada, Sofía DJ en Flux Radio, Karaoke y cero anuncios durante 7 días.</p>
          </div>
        `
      }
    });

    // 2. Recordatorio 2 días (Enviado el día 5)
    await db.collection("mail").add({
      to: email,
      delivery: { startTime: Timestamp.fromMillis(now + 5 * dayMs) },
      message: {
        subject: "Tu Pase VIP expira en 2 días",
        html: `<div style="font-family: sans-serif; background-color: #070708; padding: 40px; color: white;"><h1 style="color: #1ED760;">¡Tu prueba casi termina!</h1><p style="color: #a7a7a7;">Recuerda renovar por solo 5 €/mes para no perder tu acceso.</p></div>`
      }
    });

    // 3. Recordatorio 24 horas (Enviado el día 6)
    await db.collection("mail").add({
      to: email,
      delivery: { startTime: Timestamp.fromMillis(now + 6 * dayMs) },
      message: {
        subject: "Tu Pase VIP expira en 24 horas",
        html: `<div style="font-family: sans-serif; background-color: #070708; padding: 40px; color: white;"><h1 style="color: #1ED760;">Solo quedan 24 horas</h1><p style="color: #a7a7a7;">Renueva por solo 5 €/mes.</p></div>`
      }
    });

    // 4. Recordatorio 6 horas (Enviado el día 6 + 18h)
    await db.collection("mail").add({
      to: email,
      delivery: { startTime: Timestamp.fromMillis(now + 6 * dayMs + 18 * 60 * 60 * 1000) },
      message: {
        subject: "Últimas 6 horas de tu Pase VIP",
        html: `<div style="font-family: sans-serif; background-color: #070708; padding: 40px; color: white;"><h1 style="color: #1ED760;">¡No pierdas tu acceso!</h1><p style="color: #a7a7a7;">Quedan menos de 6 horas de VIP.</p></div>`
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error sending welcome emails:", err);
    return res.status(500).json({ error: "Error interno al enviar los correos" });
  }
}
