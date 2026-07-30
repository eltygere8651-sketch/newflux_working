const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'if (Date.now() - dbDate.getTime() < 604800000 && data.active !== false) {',
  'if (Date.now() - dbDate.getTime() < 604800000 && data.active !== false && !data.deleted) {'
);

fs.writeFileSync(path, content, 'utf8');
console.log('App patched!');
