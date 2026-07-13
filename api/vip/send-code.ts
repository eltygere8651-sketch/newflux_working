import { getFirestore } from "firebase-admin/firestore";
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

  const { email, code } = req.body || {};
  
  if (!email || typeof email !== 'string' || email.length > 100) {
    return res.status(400).json({ error: "Email no válido" });
  }
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return res.status(400).json({ error: "Código no válido" });
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

    await db.collection("mail").add({
      to: email,
      message: {
        subject: "Tu Pase VIP - Código de Verificación Flux",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #070708; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: white;">
            <h1 style="color: #1ED760; text-transform: uppercase; letter-spacing: 2px; font-size: 24px; text-align: center;">Acceso VIP</h1>
            <p style="color: #a7a7a7; font-size: 16px; line-height: 1.6; text-align: center;">Has sido invitado a disfrutar de 7 días de acceso completo. Tu código de verificación es:</p>
            <div style="background-color: rgba(30,215,96,0.1); border: 1px solid rgba(30,215,96,0.2); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1ED760;">${code}</span>
            </div>
            <p style="color: #a7a7a7; font-size: 14px; text-align: center;">Copia este código y pégalo en la aplicación para activar tu prueba gratuita.</p>
          </div>
        `
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error sending VIP code:", err);
    return res.status(500).json({ error: "Error interno al enviar el correo" });
  }
}
