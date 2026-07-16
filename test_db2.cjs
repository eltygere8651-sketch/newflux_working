const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection("users").get();
  console.log("Users in DB:");
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data().email, doc.data().plan);
  });
  
  const usersResult = await admin.auth().listUsers(100);
  console.log("Users in Auth:");
  usersResult.users.forEach(u => {
    console.log(u.uid, u.email);
  });
}
run();
