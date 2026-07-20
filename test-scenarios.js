import admin from "firebase-admin";
import { getFirestoreDb } from "./src/lib/firebase-admin.js";

async function runTests() {
  const db = getFirestoreDb();
  if (!db) throw new Error("No DB");
  
  // 1. Móvil totalmente nuevo
  console.log("--- TEST 1: Móvil totalmente nuevo ---");
  const res1 = await fetch("http://localhost:3000/api/trial/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: "test_new_device" })
  }).then(r => r.json());
  console.log("Check:", res1);
  
  const req1 = await fetch("http://localhost:3000/api/trial/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: "user_new", email: "new@example.com", fingerprint: "test_new_device", hardwareSignature: "test_new_hw" })
  }).then(r => r.json());
  console.log("Request:", req1);

  // 2. Móvil con prueba usada
  console.log("--- TEST 2: Móvil con prueba usada ---");
  await db.collection("devices").doc("test_used_device").set({
    trialUsed: true,
    trialActivatedAt: Date.now()
  });
  
  const res2 = await fetch("http://localhost:3000/api/trial/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: "test_new_device", hardwareSignature: "test_used_hw" }) 
  }).then(r => r.json());
  // Wait, if I use the same HW signature as a used one, it should NOT block it!
  // I'll test the hw signature block is gone.
  await db.collection("devices").doc("test_used_device_2").set({
    hardwareSignature: "test_shared_hw",
    trialUsed: true
  });
  
  const res3 = await fetch("http://localhost:3000/api/trial/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: "test_fresh_device", hardwareSignature: "test_shared_hw" })
  }).then(r => r.json());
  console.log("Check (shared HW, should be false!):", res3);
  
  // 3. QR Válido
  console.log("--- TEST 3: QR Válido ---");
  const qr1 = await fetch("http://localhost:3000/api/trial/activate-vip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: "test_qr_device", campaignId: "test_campaign" })
  }).then(r => r.json());
  console.log("QR Activate:", qr1);
  
  // 4. QR Repetido
  console.log("--- TEST 4: QR Repetido ---");
  // wait for previous insert to propagate (firestore is fast enough usually but let's be sure)
  await new Promise(r => setTimeout(r, 1000));
  const qr2 = await fetch("http://localhost:3000/api/trial/activate-vip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: "test_qr_device", campaignId: "test_campaign" })
  }).then(r => r.json());
  console.log("QR Repetido Activate:", qr2);
  
  process.exit(0);
}

runTests().catch(console.error);
