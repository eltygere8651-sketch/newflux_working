const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace remaining iOS gap-6 and p-5
content = content.replace(/<div className="flex flex-col gap-6">\n                  <p className="text-slate-300 font-medium leading-relaxed">\n                    En iPhone y iPad, Flux Music ofrece una <strong className="text-white">experiencia nativa y sumamente fluida<\/strong> directamente desde <strong className="text-white">el navegador Brave<\/strong>\.\n                  <\/p>\n                  \n                  <div className="bg-black\/20 rounded-2xl p-5 border border-white\/5">/g, 
  `<div className="flex flex-col gap-4">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    En iPhone y iPad, Flux Music ofrece una <strong className="text-white">experiencia nativa y sumamente fluida</strong> directamente desde <strong className="text-white">el navegador Brave</strong>.
                  </p>
                  
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">`);

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
