const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /order: data\.order \|\| 0\n        \};/;
const newAction = `order: data.order || 0,
          actionText: data.actionText || "",
          actionUrl: data.actionUrl || ""
        };`;

content = content.replace(regex, newAction);
fs.writeFileSync(path, content, 'utf8');
