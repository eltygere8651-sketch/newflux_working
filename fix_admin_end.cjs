const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// I will match everything from {activeTab === "monitor" && ( to the end of file and replace it.
const regex = /          \{activeTab === "monitor" && \([\s\S]*$/g;

const monitorSection = `          {activeTab === "monitor" && (
            <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-6 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <Bug className="w-4 h-4 text-emerald-400" /> Monitor del Ecosistema de Audio
                </h3>
                <button
                  onClick={checkSystemHealth}
                  disabled={isCheckingHealth}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-slate-300 rounded-lg transition-all border border-white/5 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isCheckingHealth ? <span className="animate-pulse">Verificando...</span> : "Verificar Ahora"}
                </button>
              </div>

              {!systemHealth && isCheckingHealth ? (
                <div className="text-center py-8 text-xs text-slate-500 animate-pulse font-medium">
                  Realizando ping a los motores de extracción (Librería Principal y Plan B)...
                </div>
              ) : systemHealth ? (
                <div className="space-y-4">
                  <div className={\`p-4 rounded-xl border flex items-center justify-between \${systemHealth.mainLibrary === "online" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}\`}>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-200">Motor Principal (Librería YouTube)</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Motor principal de la app para extraer audios HQ</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={\`w-2 h-2 rounded-full \${systemHealth.mainLibrary === "online" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"}\`} />
                      <span className={\`text-[9px] font-black uppercase tracking-widest \${systemHealth.mainLibrary === "online" ? "text-emerald-400" : "text-red-400"}\`}>
                        {systemHealth.mainLibrary === "online" ? "Operativo" : systemHealth.mainLibrary === "error" ? "Bloqueado / Error" : "Caído"}
                      </span>
                    </div>
                  </div>

                  <div className={\`p-4 rounded-xl border flex items-center justify-between \${systemHealth.planB === "online" ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"}\`}>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-200">Motor Plan B (Piped/Invidious)</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Nodos de respaldo automático antifatiga</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={\`w-2 h-2 rounded-full \${systemHealth.planB === "online" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"}\`} />
                      <span className={\`text-[9px] font-black uppercase tracking-widest \${systemHealth.planB === "online" ? "text-blue-400" : "text-red-400"}\`}>
                        {systemHealth.planB === "online" ? "Operativo" : "Nodos Caídos"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 font-mono text-center pt-2">
                    Última comprobación: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Información no disponible. Pulsa Verificar Ahora.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(regex, monitorSection);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
