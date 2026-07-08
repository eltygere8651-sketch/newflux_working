const fs = require('fs');
let json = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
json.compilerOptions.esModuleInterop = true;
json.compilerOptions.resolveJsonModule = true;
fs.writeFileSync('tsconfig.json', JSON.stringify(json, null, 2));
