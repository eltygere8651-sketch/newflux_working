const fs = require('fs');
let code = fs.readFileSync('src/components/KaraokeView.tsx', 'utf8');

code = code.replace(
    "className={\\`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all \\${micEnabled ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-red-500/20 text-red-400 border border-red-500/30'}\\`}",
    "className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${micEnabled ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}"
);

code = code.replace(
    "className={\\`transition-opacity \\${micEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}\\`}",
    "className={`transition-opacity ${micEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}"
);

code = code.replace(
    "className={\\`p-3 rounded-full transition-all \\${showSettings ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}\\`}",
    "className={`p-3 rounded-full transition-all ${showSettings ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}"
);

fs.writeFileSync('src/components/KaraokeView.tsx', code);
console.log("Fixed syntax error.");
