const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const titleRegex = /<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">\s*La experiencia completa de Flux Music\s*<\/h2>/;
const newTitle = `<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {isIOS ? "La mejor experiencia en iPhone y iPad" : "La experiencia completa de Flux Music"}
                </h2>`;

content = content.replace(titleRegex, newTitle);

const iosBlockRegex = /\/\* CONTENIDO iOS \*\/[\s\S]*?\)\s*:\s*\(\s*\/\* CONTENIDO ANDROID \(DEFAULT\) \*\//;

const newIosBlock = `/* CONTENIDO iOS */
                <div className="flex flex-col gap-4">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    En iPhone y iPad, te recomendamos utilizar Flux Music desde <strong className="text-white">Brave (el navegador Brave)</strong> para disfrutar de una experiencia más fluida y optimizada durante la reproducción.
                  </p>
                  
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <ul className="flex flex-col gap-3">
                      {[
                        "Reproducción fluida",
                        "Reproducción en segundo plano y pantalla bloqueada",
                        "Mayor estabilidad durante la escucha",
                        "Navegación rápida y segura",
                        "Experiencia optimizada para Flux Music"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-400 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-center shadow-lg">
                    <p className="text-white font-bold mb-2">Es muy fácil empezar.</p>
                    <p className="text-slate-300 text-sm mb-3">Abre Brave (el navegador Brave) y escribe directamente:</p>
                    <div className="bg-black/40 rounded-xl py-3 px-6 inline-block border border-white/10 mb-3 shadow-inner">
                      <span className="text-emerald-400 font-bold text-lg tracking-wider">fluxplay.cc</span>
                    </div>
                    <p className="text-slate-400 text-xs">En pocos segundos podrás acceder a Flux Music y disfrutar de la experiencia completa.</p>
                  </div>

                  <div className="mt-2 flex justify-start sm:justify-center">
                    <button 
                      onClick={() => window.open("https://brave.com/", "_blank")}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                    >
                      <span>Instalar Brave</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>
              ) : (
                /* CONTENIDO ANDROID (DEFAULT) */`;

content = content.replace(iosBlockRegex, newIosBlock);

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
