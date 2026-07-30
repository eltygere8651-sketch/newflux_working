const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const cards = snap\.docs\.map\(d => \{/;
content = content.replace(regex, "const cards = snap.docs.filter(d => d.data().active !== false).map(d => {");
fs.writeFileSync(path, content, 'utf8');
