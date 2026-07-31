const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /setFormActionUrl\(""\);\s*setIsModalOpen\(true\);/;
if (content.match(regex)) {
  content = content.replace(regex, 'setFormActionUrl("");\n    setFormTargetOS("all");\n    setIsModalOpen(true);');
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success reset os");
} else {
  console.log("Not found reset os");
}
