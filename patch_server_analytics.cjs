const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const updates = \{\};/,
  'const updates: Record<string, any> = {};'
);

code = code.replace(
  /for \(const \[id, data\] of Object\.entries\(songs\)\) \{/,
  'for (const [id, data] of Object.entries(songs as Record<string, any>)) {'
);

code = code.replace(
  /for \(const \[plId, data\] of Object\.entries\(playlists\)\) \{/,
  'for (const [plId, data] of Object.entries(playlists as Record<string, any>)) {'
);

code = code.replace(
  /for \(const \[key, val\] of Object\.entries\(events\)\) \{/,
  'for (const [key, val] of Object.entries(events as Record<string, any>)) {'
);

fs.writeFileSync('server.ts', code);
