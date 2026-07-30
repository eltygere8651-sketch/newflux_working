const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /hide-scrollbar/g;
const newClass = `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`;

content = content.replace(regex, newClass);
fs.writeFileSync(path, content, 'utf8');
console.log("Success");
