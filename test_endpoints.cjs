const fetch = require('node-fetch');

async function testEndpoints() {
  console.log("Testing /api/trial/request...");
  try {
    const res = await fetch('http://localhost:3000/api/trial/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'test-user-id', email: 'test@example.com' })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error("Endpoint test failed:", e);
  }
}

testEndpoints();
