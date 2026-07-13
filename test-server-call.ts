import fetch from "node-fetch";
fetch("http://localhost:3000/api/vip/send-welcome", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({email: "test_user_88@example.com"})
}).then(r => r.json()).then(console.log).catch(console.error);
