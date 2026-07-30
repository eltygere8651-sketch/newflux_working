const fs = require('fs');
const path = 'src/components/NotificationsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'import { collection, query, orderBy, limit, doc, deleteDoc } from "firebase/firestore";',
  'import { collection, query, orderBy, limit, doc, deleteDoc, setDoc } from "firebase/firestore";'
);

fs.writeFileSync(path, content, 'utf8');
