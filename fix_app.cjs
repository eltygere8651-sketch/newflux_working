const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(/useEffect\(\(\) => {\s*},\s*\[\]\);\s*/, '');

fs.writeFileSync('src/App.tsx', file);
