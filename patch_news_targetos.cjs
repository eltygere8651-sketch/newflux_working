const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexState = /const \[formCategory, setFormCategory\] = useState<string>\("actualizacion"\);/;
const newState = `const [formCategory, setFormCategory] = useState<string>("actualizacion");
  const [formTargetOS, setFormTargetOS] = useState<"all" | "ios" | "android">("all");`;
content = content.replace(regexState, newState);

const regexOpenEdit = /setFormCategory\(item\.category \|\| "actualizacion"\);/;
const newOpenEdit = `setFormCategory(item.category || "actualizacion");
    setFormTargetOS(item.targetOS || "all");`;
content = content.replace(regexOpenEdit, newOpenEdit);

const regexSaveUpdate = /actionUrl: formActionUrl\.trim\(\),(\s*\}\);)/;
const newSaveUpdate = `actionUrl: formActionUrl.trim(),
            targetOS: formCategory === "onboarding" ? formTargetOS : "all",$1`;
content = content.replace(regexSaveUpdate, newSaveUpdate);

const regexSaveNew = /actionUrl: formActionUrl\.trim\(\),(\s*createdAt: new Date\(\),)/;
const newSaveNew = `actionUrl: formActionUrl.trim(),
          targetOS: formCategory === "onboarding" ? formTargetOS : "all",$1`;
content = content.replace(regexSaveNew, newSaveNew);

const regexFormJSX = /\{formCategory === "onboarding" && \(\s*<div className="grid grid-cols-2 gap-3">/;
const newFormJSX = `{formCategory === "onboarding" && (
              <>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Dispositivos Destino
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "Ambos" },
                      { id: "android", label: "Solo Android" },
                      { id: "ios", label: "Solo iOS" }
                    ].map(os => (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => setFormTargetOS(os.id as any)}
                        className={\`p-2.5 rounded-xl border text-xs font-bold transition-all \${
                          formTargetOS === os.id 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }\`}
                      >
                        {os.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">`;
content = content.replace(regexFormJSX, newFormJSX);

fs.writeFileSync(path, content, 'utf8');
console.log("Success NewsView form");
