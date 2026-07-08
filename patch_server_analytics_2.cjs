const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /for \(const \[songId, data\] of Object\.entries\(songs\)\) \{/,
  'for (const [songId, data] of Object.entries(songs as Record<string, any>)) {'
);

fs.writeFileSync('server.ts', code);
