const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
'    if (activeTab === "featured") {\n      return cat === "urgente" || cat === "destacado" || item.id.startsWith("featured-") || item.id === "update-v1.9.0";\n    }',
'    if (activeTab === "featured") {\n      return cat === "urgente" || cat === "destacado" || cat === "onboarding" || item.id.startsWith("featured-") || item.id === "update-v1.9.0";\n    }\n    if (activeTab === "onboarding") {\n      return cat === "onboarding";\n    }'
);

fs.writeFileSync(path, content, 'utf8');
