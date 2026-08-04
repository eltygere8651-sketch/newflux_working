const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

code = code.replace(/(<\/div>\s*)+  \);\n};\n?$/, '');
code += `
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/VideoView.tsx', code);
