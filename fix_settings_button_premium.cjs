const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const target = /<button[\s\S]*?onClick=\{\(\) => setShowConfig\(true\)\}[\s\S]*?title="Configuración de Mezcla"[\s\S]*?>[\s\S]*?<Settings2[^>]*\/>[\s\S]*?<\/button>/;

const replacement = `<button
            onClick={() => setShowConfig(true)}
            className="group relative overflow-hidden h-10 sm:h-12 px-5 sm:px-6 rounded-full flex items-center gap-2 sm:gap-3 transition-all hover:scale-[1.02] active:scale-95 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-fuchsia-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(232,121,249,0.2)]"
            title="Configuración de Mezcla"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)] group-hover:animate-spin-slow relative z-10" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm relative z-10">
              Ajustes FLX
            </span>
          </button>`;

if (target.test(code)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/FAIView.tsx', code);
    console.log("Updated FAIView.tsx Settings button via Regex successfully.");
} else {
    console.log("Regex failed too.");
}
