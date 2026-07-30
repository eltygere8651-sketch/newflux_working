const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = `        {/* ACTIVE SUBMENU DESCRIPTION BANNER */}
        <div
          className={\`mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r \${activeConfig.colorAccent} border backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl transition-all duration-300\`}
        >
          <div className={\`p-3 rounded-xl border \${activeConfig.iconBg} shrink-0\`}>
            <ActiveIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
              {activeConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {activeConfig.description}
            </p>
          </div>
        </div>`;

const onboardingPanel = `
        {activeTab === "onboarding" && isAdmin && (
          <div className="mb-6 p-5 rounded-2xl bg-[#08090d] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Control de Versiones y Despliegue
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Actualmente tienes <strong className="text-white">{filteredItems.length}</strong> tarjetas configuradas. Pulsa "Nueva Publicación" para añadir una tarjeta modular. Al publicar, se incrementará la versión y todos los usuarios verán el nuevo onboarding.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button 
                onClick={() => {
                  window.dispatchEvent(new Event("preview-onboarding"));
                }} 
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-full uppercase tracking-wider transition-all"
              >
                Vista Previa
              </button>
              <button 
                onClick={async () => {
                  try {
                    const configRef = doc(db, "config", "onboarding");
                    const docSnap = await import("firebase/firestore").then(m => m.getDoc(configRef));
                    let currentVersion = 1;
                    if (docSnap.exists()) {
                      currentVersion = docSnap.data().version || 1;
                      await import("firebase/firestore").then(m => m.updateDoc(configRef, { version: currentVersion + 1 }));
                    } else {
                      await import("firebase/firestore").then(m => m.setDoc(configRef, { version: 2 }));
                    }
                    alert(\`¡Onboarding publicado correctamente! (Versión \${currentVersion + 1})\`);
                  } catch (e) {
                    console.error(e);
                    alert("Error al publicar.");
                  }
                }} 
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
                Publicar para todos
              </button>
            </div>
          </div>
        )}
`;

content = content.replace(anchor, anchor + onboardingPanel);
fs.writeFileSync(path, content, 'utf8');
