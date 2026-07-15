const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');

const targetImport = "import { Check, Loader2, ArrowRight, MessageSquare } from 'lucide-react';";
const replacementImport = "import { Check, Loader2, ArrowRight, MessageSquare, Info } from 'lucide-react';";
code = code.replace(targetImport, replacementImport);

const targetButton = `          <div className="space-y-4 mb-10 text-left w-full pl-4 md:pl-8">
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Música ilimitada</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Sin anuncios</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Karaoke Premium</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Flux Radio IA</p>
          </div>

          <button`;

const replacementButton = `          <div className="space-y-4 mb-6 text-left w-full pl-4 md:pl-8">
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Música ilimitada</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Sin anuncios</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Karaoke Premium</p>
            <p className="text-white font-bold flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0"/> Flux Radio IA</p>
          </div>

          <div className="mb-8 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  Tendrás acceso a prácticamente toda la experiencia Flux Music durante tu prueba gratuita. La reproducción de música con la pantalla del móvil bloqueada es una ventaja exclusiva para los usuarios Premium.
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  Descubre todo lo demás sin restricciones y decide después si quieres dar el salto a Premium.
                </p>
              </div>
            </div>
          </div>

          <button`;

code = code.replace(targetButton, replacementButton);
fs.writeFileSync('src/components/VIPLandingView.tsx', code);
