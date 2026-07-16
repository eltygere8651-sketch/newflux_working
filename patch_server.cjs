const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = `app.post("/api/vip/recover", async (req, res) => {`;
const replaceStr = `app.delete("/api/admin/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const adminEmail = req.headers["x-admin-email"];
  
  if (adminEmail !== "eltygere8651@gmail.com") {
    return res.status(403).json({ error: "No autorizado. Solo el administrador puede borrar usuarios." });
  }

  try {
    try {
      await admin.auth().deleteUser(userId);
    } catch (authErr) {
      console.warn("User not found in Auth, but proceeding to delete from DB", authErr);
    }
    const db = getFirestoreDb();
    if (db) {
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

app.post("/api/vip/recover", async (req, res) => {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('server.ts', code);
