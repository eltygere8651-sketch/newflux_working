const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLogoSection = `          {/* CENTER: LOGO BRAND */}
          <div className="shrink-0 flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div 
              className="flex items-center gap-2.5 group cursor-default select-none"
            >
              <div className="relative">
                <FluxLogo className="w-9 h-9" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-brand font-black tracking-[-0.05em] uppercase leading-none select-none text-white transition-all duration-700 group-hover:tracking-[0.05em]">
                  FLUX
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
                  <div className="h-[1px] w-3 bg-emerald-500/40" />
                  <span className="text-[7px] font-bold tracking-[0.3em] text-emerald-400 uppercase leading-none">
                    MUSIC
                  </span>
                  <div className="h-[1px] w-3 bg-emerald-500/40" />
                </div>
              </div>
            </div>
          </div>`;

const newLogoSection = `          {/* CENTER: LOGO BRAND */}
          <div className="shrink-0 flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 sm:gap-2.5 group cursor-default select-none">
              <FluxLogo className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md transition-transform duration-500 group-hover:scale-105" />
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-brand font-black tracking-[-0.02em] uppercase leading-none text-white drop-shadow-sm transition-colors group-hover:text-emerald-400">
                  FLUX
                </span>
              </div>
            </div>
          </div>`;

content = content.replace(oldLogoSection, newLogoSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_logo_refine.cjs');
