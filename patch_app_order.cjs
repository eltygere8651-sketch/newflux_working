const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSort = `          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime()) : 0
        };
      }).sort((a,b) => a.createdAt - b.createdAt);`;
const newSort = `          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime()) : 0,
          order: data.order || 0
        };
      }).sort((a,b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);`;

content = content.replace(oldSort, newSort);
fs.writeFileSync(path, content, 'utf8');
