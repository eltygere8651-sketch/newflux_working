const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSection = `              <div className="flex flex-col items-center">
                <span className="text-2xl font-brand font-black tracking-[-0.05em] uppercase leading-none select-none text-white transition-all duration-700 group-hover:tracking-[0.05em]">
                  FLUX
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
                  <div className="h-[1px] w-3 bg-emerald-500/40" />
                  <span className="text-[7px] font-bold tracking-[0.3em] text-emerald-400 uppercase leading-none">
                    PLAY
                  </span>
                  <div className="h-[1px] w-3 bg-emerald-500/40" />
                </div>
              </div>`;

const newSection = `              <div className="flex flex-col items-center justify-center pt-0.5">
                <span className="text-[26px] sm:text-[28px] font-brand font-black tracking-tighter uppercase leading-none select-none text-white drop-shadow-sm transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                  FLUX
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 opacity-100">
                  <div className="h-[1.5px] w-3 sm:w-4 bg-gradient-to-r from-transparent to-emerald-500/70 rounded-full" />
                  <span className="text-[8px] sm:text-[9px] font-black tracking-[0.35em] text-emerald-400 uppercase leading-none drop-shadow-sm ml-0.5">
                    PLAY
                  </span>
                  <div className="h-[1.5px] w-3 sm:w-4 bg-gradient-to-l from-transparent to-emerald-500/70 rounded-full" />
                </div>
              </div>`;

content = content.replace(oldSection, newSection);
fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_title_premium.cjs');
