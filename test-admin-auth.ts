import admin from "firebase-admin";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: config.projectId,
});

admin.auth().listUsers(1).then(res => console.log("Success:", res.users.length)).catch(e => console.error("Error:", e.message));
