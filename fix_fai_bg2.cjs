const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-fuchsia-900/10 via-[#0a0a0b] to-[#0a0a0b] blur-[120px] rounded-full pointer-events-none" />',
  '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-b from-fuchsia-600/10 via-cyan-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />'
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated FAIView background");
