
async function testEndpoint() {
  console.log("Testing /api/trial/check...");
  try {
    const res = await fetch('http://localhost:3000/api/trial/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: 'test-fingerprint' })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error("Endpoint test failed:", e);
  }
}

testEndpoint();
