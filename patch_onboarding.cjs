const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const iosOld = `              {isIOS ? (
                /* CONTENIDO iOS */
                <div className="flex flex-col gap-6">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    En iPhone y iPad, la mejor experiencia de Flux Music se obtiene utilizando <strong className="text-white">Brave (el navegador Brave)</strong>.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Debido a las limitaciones de iOS, la instalación desde Brave funciona de forma diferente, pero utilizar Flux Music directamente desde Brave ofrece la experiencia más optimizada disponible para iPhone y iPad.
                  </p>
                  
                  <div className="mt-2">
                    <button 
                      onClick={() => window.open("https://brave.com/", "_blank")}
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-full font-bold transition-all text-sm"
                    >
                      <span>Abrir en Brave</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>`;

const iosNew = `              {isIOS ? (
                /* CONTENIDO iOS */
                <div className="flex flex-col gap-6">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    En iPhone y iPad, Flux Music ofrece una <strong className="text-white">experiencia nativa y sumamente fluida</strong> directamente desde <strong className="text-white">el navegador Brave</strong>.
                  </p>
                  
                  <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                    <p className="text-sm font-bold text-slate-200 mb-4">Con Brave en tu dispositivo disfrutarás de:</p>
                    <ul className="flex flex-col gap-3">
                      {[
                        "Reproducción fluida en segundo plano",
                        "Música con la pantalla bloqueada",
                        "Una experiencia premium sin interrupciones",
                        "Bajo consumo de batería y rendimiento óptimo",
                        "Acceso seguro e ininterrumpido"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-400 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2">
                    <button 
                      onClick={() => window.open("https://brave.com/", "_blank")}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                    >
                      <span>Continuar con Brave</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>`;

if (content.includes(iosOld)) {
  content = content.replace(iosOld, iosNew);
  console.log("Successfully replaced iOS block.");
} else {
  console.log("iOS block not found. Checking exactly what it looks like:");
  console.log(content.substring(content.indexOf("{isIOS ? ("), content.indexOf("{isIOS ? (") + 1500));
}

fs.writeFileSync(path, content, 'utf8');
