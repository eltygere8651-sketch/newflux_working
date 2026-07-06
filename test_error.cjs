const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace('res.status(500).json({ error: "Failed to fetch community playlists" });', 'res.status(500).json({ error: "Failed to fetch community playlists", details: err.message, stack: err.stack });');
fs.writeFileSync('server.ts', code);
