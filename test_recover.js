const fetch = require('node-fetch');
fetch('http://localhost:3000/api/vip/recover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ deviceHash: 'test' })
}).then(res => res.text()).then(console.log);
