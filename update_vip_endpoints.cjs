const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The endpoint was already added, let's just replace the riskScore block
code = code.replace(
  /if \(riskScore >= 100\) \{\s*return res\.status\(403\)\.json\(\{ error: "Risk score too high, trial denied\." \}\);\s*\}/,
  `if (riskScore >= 100) {
       await db.collection('vip_blocked').add({ deviceHash, timestamp: Date.now() });
       return res.status(403).json({ error: "Risk score too high, trial denied." });
    }`
);

fs.writeFileSync('server.ts', code);
