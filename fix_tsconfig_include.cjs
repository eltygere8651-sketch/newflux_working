const fs = require('fs');
let json = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
json.include.push("api/**/*");
fs.writeFileSync('tsconfig.json', JSON.stringify(json, null, 2));
