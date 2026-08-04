const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const returnIdx = code.indexOf('return (');
console.log(code.substring(returnIdx));
