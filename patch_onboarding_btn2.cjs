const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexContainerStart = /className="fixed inset-0 z-\[9999\] bg-\[#050505\] text-white overflow-y-auto overflow-x-hidden">/;
const newContainerStart = `className="fixed inset-0 z-[9999] bg-[#050505] text-white overflow-hidden flex flex-col">`;
content = content.replace(regexContainerStart, newContainerStart);

const regexScrollContainerStart = /className="min-h-full w-full max-w-2xl mx-auto px-4 py-12 sm:px-8 sm:py-16 flex flex-col">/;
const newScrollContainerStart = `className="flex-1 w-full max-w-2xl mx-auto px-4 pt-12 pb-40 sm:px-8 sm:pt-16 sm:pb-48 flex flex-col overflow-y-auto hide-scrollbar">`;
content = content.replace(regexScrollContainerStart, newScrollContainerStart);

const regexFooter = /\{\/\* FOOTER ACTIONS \*\/\}[\s\S]*?<\/div>\n    <\/div>\n  \);/m;
const newFooter = `{/* FOOTER ACTIONS */}
      </div>

      {/* STICKY BOTTOM ACTIONS */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 w-full p-6 sm:p-8 pt-20 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pointer-events-none flex flex-col items-center z-50"
      >
        <div className="pointer-events-auto flex flex-col items-center w-full max-w-xl mx-auto">
          <button
            onClick={onComplete}
            className="w-full bg-white text-black hover:bg-slate-200 px-8 py-4 sm:py-5 rounded-full font-black text-sm sm:text-base uppercase tracking-widest transition-all shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_40px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span>Entrar en Flux Music</span>
            <Play className="w-5 h-5 fill-black" />
          </button>
          <p className="text-slate-500 text-[10px] sm:text-xs mt-4 sm:mt-5 font-medium text-center px-4">
            Al continuar, aceptas que Flux Music está optimizado para navegadores modernos.
          </p>
        </div>
      </motion.div>
    </div>
  );`;

if (content.match(regexFooter)) {
  content = content.replace(regexFooter, newFooter);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
