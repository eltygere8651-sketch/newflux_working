const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const stateInjection = `  const adminChatEndRef = useRef<HTMLDivElement>(null);
  
  const [isRestoringThumbnails, setIsRestoringThumbnails] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState("");
`;

code = code.replace("  const adminChatEndRef = useRef<HTMLDivElement>(null);", stateInjection);

const fnInjection = `  const handleRestoreThumbnails = async () => {
    setIsRestoringThumbnails(true);
    setRestoreProgress("Iniciando restauración de carátulas...");
    try {
      const q = query(collection(db, "explore_custom_playlists"));
      const snap = await getDocs(q);
      const docs = snap.docs;
      
      let fixed = 0;
      let total = docs.length;

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        const data = d.data();
        setRestoreProgress(\`Procesando playlist \${i + 1} de \${total}: \${data.title || "Sin título"}\`);
        
        if (!data.thumbnail || data.thumbnail.trim() === "" || data.thumbnail.includes("mqdefault.jpg")) {
          // Attempt to fetch from backend
          const isPlaylist = data.isPlaylist;
          const id = data.id;
          
          if (!id) continue;

          try {
            const endpoint = isPlaylist
              ? \`/api/youtube/playlist-info?id=\${id}\`
              : \`/api/youtube/video-info?id=\${id}\`;
            const res = await fetch(endpoint);
            if (res.ok) {
              const info = await res.json();
              if (info.thumbnail && info.thumbnail.trim() !== "") {
                await updateDoc(doc(db, "explore_custom_playlists", d.id), {
                  thumbnail: info.thumbnail
                });
                fixed++;
              }
            }
          } catch (err) {
            console.error("Error fetching thumbnail for", id, err);
          }
        }
      }
      setRestoreProgress(\`Restauración completada. \${fixed} carátulas restauradas.\`);
      
      window.dispatchEvent(new Event("refreshExplore"));
      
      setTimeout(() => setRestoreProgress(""), 5000);
    } catch (e) {
      console.error(e);
      setRestoreProgress("Error al restaurar carátulas.");
      setTimeout(() => setRestoreProgress(""), 3000);
    }
    setIsRestoringThumbnails(false);
  };

  return (`;

code = code.replace("  return (", fnInjection);


const uiInjection = `                  <div className="text-[9px] text-slate-500 font-mono text-center pt-2">
                    Última comprobación: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Información no disponible. Pulsa Verificar Ahora.
                </div>
              )}
              
              {/* RESTAURAR CARATULAS */}
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-400">Mantenimiento de Explorador</h4>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    Fuerza la restauración de las carátulas faltantes de las playlists añadidas en el Explorador.
                  </p>
                </div>
                
                {restoreProgress && (
                  <div className="bg-purple-500/10 text-purple-300 text-xs p-3 rounded-lg border border-purple-500/20 font-medium">
                    {restoreProgress}
                  </div>
                )}
                
                <button
                  onClick={handleRestoreThumbnails}
                  disabled={isRestoringThumbnails}
                  className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-purple-500/20 disabled:opacity-50"
                >
                  {isRestoringThumbnails ? "Restaurando..." : "Restaurar Carátulas Faltantes"}
                </button>
              </div>`;

code = code.replace(`                  <div className="text-[9px] text-slate-500 font-mono text-center pt-2">
                    Última comprobación: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Información no disponible. Pulsa Verificar Ahora.
                </div>
              )}`, uiInjection);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log("Patched successfully");
