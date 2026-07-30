const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
'          {Object.values(SUBMENU_CONFIG).map((sub) => {',
'          {Object.values(SUBMENU_CONFIG).filter(sub => isAdmin || sub.id !== "onboarding").map((sub) => {'
);

fs.writeFileSync(path, content, 'utf8');
