const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

code = code.replace(/          <\/div>\n          <\/div>\n        \}\)/, '          </div>\n        )}');

fs.writeFileSync('src/components/VideoView.tsx', code);
