const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\{"\*"} Modal Actions \{\*"\}\//;
const newUI = `{/* Action Button Inputs */}
            {formCategory === "onboarding" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Texto del Botón (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formActionText}
                    onChange={(e) => setFormActionText(e.target.value)}
                    placeholder="Ej. Saber más"
                    className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    URL del Botón (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formActionUrl}
                    onChange={(e) => setFormActionUrl(e.target.value)}
                    placeholder="Ej. https://..."
                    className="w-full px-4 py-2.5 bg-[#08090d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/50 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}`;

content = content.replace('{/* Modal Actions */}', newUI);

const regexSave2 = /content: formContent\.trim\(\),\n          createdAt: new Date\(\),\n          active: true,\n        \};/m;
const newSave2 = `content: formContent.trim(),
          actionText: formActionText.trim(),
          actionUrl: formActionUrl.trim(),
          createdAt: new Date(),
          active: true,
        };`;
content = content.replace(regexSave2, newSave2);

fs.writeFileSync(path, content, 'utf8');
