const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const currentLogoSection = `          {/* CENTER: LOGO BRAND */}
          <div className="shrink-0 flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 sm:gap-2.5 group cursor-default select-none">
              <FluxLogo className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md transition-transform duration-500 group-hover:scale-105" />
              <div className="flex items-baseline gap-1 sm:gap-1.5 pt-0.5">
                <span className="text-[22px] sm:text-[26px] font-brand font-black tracking-tight uppercase leading-none text-white drop-shadow-md transition-colors group-hover:text-emerald-400">
                  FLUX
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.25em] uppercase leading-none text-emerald-400/90 hidden sm:inline-block">
                  MUSIC
                </span>
              </div>
            </div>
          </div>`;

const originalLogoSection = `          {/* CENTER: LOGO BRAND */}
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

content = content.replace(currentLogoSection, originalLogoSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_logo_restore.cjs');
