const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  '      } else {\n        onTogglePlay();\n      }',
  '      } else {\n        if (!isPlaying) onTogglePlay();\n      }'
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated handleStartWelcome play check");
