const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "ai-studio-a49e097c-114f-471a-ad4d-816b4092e3ad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docSnap = await getDoc(doc(db, "config", "onboarding"));
  if (docSnap.exists()) {
    console.log("Version:", docSnap.data().version, typeof docSnap.data().version);
  } else {
    console.log("No config");
  }
}
run();
