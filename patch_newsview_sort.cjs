const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const filteredItems = announcements\.filter\(\(item\) => \{[\s\S]*?\n  \}\);\n/m;
const match = content.match(regex);
if (match) {
  const newText = match[0].replace('});', '}).sort((a,b) => (a.order || 0) - (b.order || 0) || b.createdAt - a.createdAt);');
  content = content.replace(match[0], newText);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
