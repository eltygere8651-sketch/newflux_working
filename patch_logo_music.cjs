const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLogoSection = `              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-brand font-black tracking-[-0.02em] uppercase leading-none text-white drop-shadow-sm transition-colors group-hover:text-emerald-400">
                  FLUX
                </span>
              </div>`;

const newLogoSection = `              <div className="flex items-baseline gap-1 sm:gap-1.5 pt-0.5">
                <span className="text-[22px] sm:text-[26px] font-brand font-black tracking-tight uppercase leading-none text-white drop-shadow-md transition-colors group-hover:text-emerald-400">
                  FLUX
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.25em] uppercase leading-none text-emerald-400/90 hidden sm:inline-block">
                  MUSIC
                </span>
              </div>`;

content = content.replace(oldLogoSection, newLogoSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_logo_music.cjs');
