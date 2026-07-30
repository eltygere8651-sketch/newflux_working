const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = 'className={`group bg-[#111218] rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/40 transition-all duration-300 flex flex-col shadow-xl relative ${';
const replacementStr = 'className={`group bg-[#111218] rounded-2xl overflow-hidden border ${item.active === false ? "border-rose-500/50 opacity-60 grayscale-[50%]" : "border-white/10"} hover:border-amber-400/40 transition-all duration-300 flex flex-col shadow-xl relative ${';

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
