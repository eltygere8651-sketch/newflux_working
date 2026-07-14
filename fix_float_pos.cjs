const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetFloat = `className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[90] flex justify-end pointer-events-none"`;
const replaceFloat = `className="fixed bottom-36 right-4 sm:bottom-10 sm:right-10 z-[90] flex justify-end pointer-events-none"`;

code = code.replace(targetFloat, replaceFloat);
fs.writeFileSync('src/App.tsx', code);
console.log('Moved float');
