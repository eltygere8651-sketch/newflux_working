const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSort = '}).sort((a,b) => (a.order || 0) - (b.order || 0) || b.createdAt - a.createdAt);';
const newSort = `}).sort((a,b) => {
    if (a.category === 'onboarding' && b.category === 'onboarding') {
      return (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt;
    }
    return (a.order || 0) - (b.order || 0) || b.createdAt - a.createdAt;
  });`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
