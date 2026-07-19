const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) : admin.credential.applicationDefault(),
  projectId: config.projectId,
});
const db = config.firestoreDatabaseId ? getFirestore(config.firestoreDatabaseId) : getFirestore();

async function migrate() {
  const customPlaylists = await db.collection('explore_custom_playlists').get();
  let count = 0;
  for (const doc of customPlaylists.docs) {
    if (!doc.data().country) {
      await doc.ref.update({ country: 'ES' });
      count++;
    }
  }
  console.log(`Updated ${count} custom playlists with country: ES`);

  const globalLayout = await db.collection('admin').doc('explore_layout').get();
  if (globalLayout.exists) {
    const data = globalLayout.data();
    await db.collection('admin').doc('explore_layout_ES').set(data);
    console.log(`Copied explore_layout to explore_layout_ES`);
  }
}

migrate().catch(console.error);
