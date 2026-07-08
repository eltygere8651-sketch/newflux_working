const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldLabel = `                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      URL de la Foto de Portada (Déjalo en blanco para
                      auto-generar)
                    </label>`;

const newLabel = `                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      URL de la Foto de Portada
                    </label>`;

code = code.replace(oldLabel, newLabel);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
