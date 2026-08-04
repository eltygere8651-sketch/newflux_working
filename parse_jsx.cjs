const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const returnIdx = code.indexOf('return (');
const jsxStr = code.substring(returnIdx + 'return ('.length);

console.log("JSX length:", jsxStr.length);
