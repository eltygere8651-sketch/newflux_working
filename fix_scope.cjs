const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{\n  try \{\n    const index = Math\.floor\(Math\.random\(\) \* SOFIA_WELCOME_PHRASES\.length\);\n    const selectedText = SOFIA_WELCOME_PHRASES\[index\];\n    const cacheKey = `\$\{index\}`;\n/g;

const newCode = `app.get("/api/radio/welcome", async (req, res) => {
  const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
  const selectedText = SOFIA_WELCOME_PHRASES[index];
  const cacheKey = \`\${index}\`;
  try {
`;

code = code.replace(regex, newCode);

fs.writeFileSync('server.ts', code);
