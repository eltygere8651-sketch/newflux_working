import fetch from "node-fetch";
fetch("http://localhost:3000/api/vip/send-code", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({email: "final_test@example.com", code: "999999"})
}).then(r => r.json()).then(console.log).catch(console.error);
