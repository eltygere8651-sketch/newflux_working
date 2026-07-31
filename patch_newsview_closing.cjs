const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const errorRegex = /\s+<\/div>\n\s+<\/div>\n\s+\)\}\n\s+\{\/\* Modal Actions \*\/\}/;
const newString = `\n                </div>\n              </div>\n              </>\n            )}\n            {/* Modal Actions */}`;
if (content.match(errorRegex)) {
  content = content.replace(errorRegex, newString);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success closing tag");
} else {
  console.log("Not found closing tag");
}
