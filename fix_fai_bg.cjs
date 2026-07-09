const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />',
  '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-fuchsia-900/10 via-[#0a0a0b] to-[#0a0a0b] blur-[120px] rounded-full pointer-events-none" />'
);

code = code.replace(
  '<div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-[2rem] opacity-50 pointer-events-none" />',
  '<div className="absolute inset-0 bg-fuchsia-500/10 blur-3xl rounded-[2rem] opacity-50 pointer-events-none" />'
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated FAIView background");
