const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const target = `<button
            onClick={() => setShowConfig(true)}
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full backdrop-blur-md transition-all shadow-xl hover:shadow-[#17d1a5]/20 text-white/40 hover:text-white"
            title="Configuración de Mezcla"
          >
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>`;

const replacement = `<button
            onClick={() => setShowConfig(true)}
            className="relative overflow-hidden w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full flex flex-col items-center justify-center transition-all bg-[#1ED760] text-black shadow-[0_0_15px_rgba(30,215,96,0.4)] border border-[#1ED760]/30 hover:scale-105"
            title="Configuración de Mezcla"
          >
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[7px] font-black uppercase tracking-wider">Ajustes</span>
          </button>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FAIView.tsx', code);
  console.log("Updated FAIView.tsx Settings button successfully.");
} else {
  console.log("Could not find the target string! Trying regex...");
  // Fallback if formatting is slightly different
  const regexTarget = /<button[\s\S]*?onClick=\{\(\) => setShowConfig\(true\)\}[\s\S]*?title="Configuración de Mezcla"[\s\S]*?>[\s\S]*?<Settings2[^>]*\/>[\s\S]*?<\/button>/;
  if (regexTarget.test(code)) {
      code = code.replace(regexTarget, replacement);
      fs.writeFileSync('src/components/FAIView.tsx', code);
      console.log("Updated FAIView.tsx Settings button via Regex successfully.");
  } else {
      console.log("Regex failed too.");
  }
}
