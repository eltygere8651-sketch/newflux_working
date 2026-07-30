const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexImports = /import React, \{ useState, useEffect \} from "react";/;
const newImports = `import React, { useState, useEffect, useRef } from "react";`;
content = content.replace(regexImports, newImports);

const regexProps = /export function UniversalOnboarding.*\{/s;
const newProps = `export function UniversalOnboarding({ onComplete, cards = [] }: UniversalOnboardingProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    const timeoutId = setTimeout(checkScroll, 500);
    const timeoutId2 = setTimeout(checkScroll, 1500);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [cards]);
`;
content = content.replace(/export function UniversalOnboarding[\s\S]*?const modularCards = cards;/s, newProps + "\n  const modularCards = cards;");

const regexScrollContainer = /<div className="flex-1 w-full max-w-2xl mx-auto px-4 pt-12 pb-40 sm:px-8 sm:pt-16 sm:pb-48 flex flex-col overflow-y-auto \[\&::-webkit-scrollbar\]:hidden \[-ms-overflow-style:none\] \[scrollbar-width:none\]">/s;
const newScrollContainer = `<div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 w-full max-w-xl mx-auto px-4 pt-8 pb-32 sm:px-6 sm:pt-10 sm:pb-36 flex flex-col gap-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >`;
content = content.replace(regexScrollContainer, newScrollContainer);

// Make the header more compact
const regexHeader = /<motion\.div \n          initial=\{\{ opacity: 0, y: 20 \}\}\n          animate=\{\{ opacity: 1, y: 0 \}\}\n          transition=\{\{ duration: 0\.6, ease: \[0\.16, 1, 0\.3, 1\] \}\}\n          className="flex flex-col items-center text-center mb-12"\>\n          <div className="mb-6 relative"\>\n            <div className="absolute inset-0 bg-emerald-500\/20 blur-\[40px\] rounded-full" \/>\n            <FluxLogoLarge className="w-24 h-24 relative z-10" \/>\n          <\/div>\n          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white\/60"\>\n            Bienvenido a Flux Music\n          <\/h1>\n          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md leading-relaxed"\>\n            Antes de comenzar, descubre cómo disfrutar de la mejor experiencia posible con Flux Music\.\n          <\/p>\n        <\/motion\.div>/s;
const newHeader = `<motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[30px] rounded-full" />
            <FluxLogoLarge className="w-16 h-16 relative z-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            Bienvenido a Flux Music
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm leading-relaxed">
            Revisa esta información para disfrutar de la mejor experiencia.
          </p>
        </motion.div>`;
content = content.replace(regexHeader, newHeader);

// Compact the main card padding
content = content.replace(/p-6 sm:p-8/g, 'p-5 sm:p-6');
content = content.replace(/mb-6/g, 'mb-4');
content = content.replace(/gap-6/g, 'gap-4');
content = content.replace(/p-5/g, 'p-4');

// Update button rendering
const regexBtnContainer = /<div className="pointer-events-auto flex flex-col items-center w-full max-w-xl mx-auto">[\s\S]*?<\/div>/s;
const newBtnContainer = `<div className="pointer-events-auto flex flex-col items-center w-full max-w-xl mx-auto">
          <button
            onClick={() => {
              if (hasScrolledToBottom) {
                onComplete();
              }
            }}
            disabled={!hasScrolledToBottom}
            className={\`w-full px-8 py-4 sm:py-4 rounded-full font-black text-sm sm:text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 \${
              hasScrolledToBottom 
                ? "bg-white text-black hover:bg-slate-200 shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_40px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98]" 
                : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
            }\`}
          >
            <span>{hasScrolledToBottom ? "Entrar en Flux Music" : "Desliza para continuar"}</span>
            {hasScrolledToBottom && <Play className="w-5 h-5 fill-black" />}
          </button>
          <p className="text-slate-500 text-[10px] sm:text-xs mt-3 sm:mt-4 font-medium text-center px-4">
            Al continuar, aceptas que Flux Music está optimizado para navegadores modernos.
          </p>
        </div>`;
content = content.replace(regexBtnContainer, newBtnContainer);

// Make modal header compact
content = content.replace(/<div className="flex-1 flex flex-col gap-6">/, '<div className="flex-1 flex flex-col gap-4">');

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
