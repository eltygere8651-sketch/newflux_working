import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const q = query(collection(db, "mail"), where("to", "==", "test_user_88@example.com"));
getDocs(q).then(snap => {
  snap.forEach(doc => console.log(doc.id, "=>", doc.data()));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
