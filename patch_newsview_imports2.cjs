const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /import \{\s*ChevronUp,/;
content = content.replace(regex, "import { Eye, EyeOff, ChevronUp,");
fs.writeFileSync(path, content, 'utf8');
