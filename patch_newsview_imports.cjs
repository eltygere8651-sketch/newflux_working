const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /import \{\s*Trash2,/;
content = content.replace(regex, "import { ChevronUp, ChevronDown, Trash2,");
fs.writeFileSync(path, content, 'utf8');
