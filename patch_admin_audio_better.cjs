const fs = require('fs');

let content = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

// Ensure Play icon is imported
if (!content.includes("Play,")) {
  content = content.replace("Trash,", "Trash,\n  Play,");
}

// Add state
const stateHook = `  const [telegramToken, setTelegramToken] = useState("");
  const [systemAudioFiles, setSystemAudioFiles] = useState<{name: string, url: string, size: number}[]>([]);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const fetchSystemAudioFiles = async () => {
    try {
      const res = await fetch('/api/admin/system-audio');
      if (res.ok) {
        const data = await res.json();
        setSystemAudioFiles(data.files || []);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const deleteSystemAudioFile = async (filename: string) => {
    if (!confirm("¿Seguro que deseas eliminar este archivo?")) return;
    try {
      const res = await fetch(\`/api/admin/system-audio/\${filename}\`, { method: 'DELETE' });
      if (res.ok) {
        fetchSystemAudioFiles();
      }
    } catch(e) {
      console.error(e);
    }
  };
`;
content = content.replace(`  const [telegramToken, setTelegramToken] = useState("");`, stateHook);

// Fetch on notifications tab load
const fetchHook = `      activeTab === "notifications" &&
      !adminDataLoadedRef.current.notifications
    ) {
      adminDataLoadedRef.current.notifications = true;
      fetchTelegramConfig();
      fetchSystemAudioFiles();`;
content = content.replace(`      activeTab === "notifications" &&
      !adminDataLoadedRef.current.notifications
    ) {
      adminDataLoadedRef.current.notifications = true;
      fetchTelegramConfig();`, fetchHook);

// Replace UI
const oldUI = `                {/* AUDIO UPLOAD FOR SYSTEM ANNOUNCEMENTS */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                      <Mic className="w-4 h-4 text-amber-400" /> Archivos de Audio del Sistema
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Sube archivos de audio (como .mp3) para ser usados en anuncios u otras notificaciones dentro de Flux Music.</p>
                  
                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      accept="audio/*"
                      id="system-audio-upload"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.name.endsWith('.mp3')) {
                          alert('Por favor, selecciona un archivo MP3.');
                          return;
                        }
                        
                        const formData = new FormData();
                        formData.append('audio', file);
                        
                        try {
                          // Change the visual indicator to loading
                          const label = document.getElementById('audio-upload-label');
                          if (label) {
                            label.innerText = 'Subiendo...';
                            label.classList.add('animate-pulse');
                          }
                          
                          const res = await fetch('/api/admin/upload-audio', {
                            method: 'POST',
                            body: formData
                          });
                          
                          if (label) {
                            label.innerText = 'Seleccionar archivo MP3';
                            label.classList.remove('animate-pulse');
                          }
                          
                          if (!res.ok) throw new Error('Error al subir');
                          const data = await res.json();
                          alert('Archivo ' + data.filename + ' subido correctamente a ' + data.url);
                          
                        } catch (err) {
                          alert('Fallo la subida del archivo');
                          const label = document.getElementById('audio-upload-label');
                          if (label) {
                            label.innerText = 'Seleccionar archivo MP3';
                            label.classList.remove('animate-pulse');
                          }
                        }
                        
                        // Clear the input so the same file can be uploaded again if needed
                        e.target.value = '';
                      }}
                    />
                    <label 
                      htmlFor="system-audio-upload"
                      id="audio-upload-label"
                      className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl py-3 px-4 text-center transition-all inline-block w-full max-w-xs"
                    >
                      Seleccionar archivo MP3
                    </label>
                  </div>
                </div>`;

const newUI = `                {/* AUDIO UPLOAD FOR SYSTEM ANNOUNCEMENTS */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                      <Mic className="w-4 h-4 text-amber-400" /> Archivos de Audio del Sistema
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Sube archivos de audio (.mp3, .wav) para ser usados en anuncios u otras notificaciones dentro de Flux Music.
                    Por ejemplo, nombra el archivo <b>audio-informativo-bloqueo.mp3</b> para que sea el audio por defecto cuando un usuario bloquea la pantalla sin Brave.
                  </p>
                  
                  <div className="space-y-4">
                    {systemAudioFiles.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Archivos Subidos</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {systemAudioFiles.map((file, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:border-white/20 transition-all">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <button
                                  onClick={() => {
                                    if (playingAudio === file.url) {
                                      setPlayingAudio(null);
                                    } else {
                                      setPlayingAudio(file.url);
                                    }
                                  }}
                                  className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all \${playingAudio === file.url ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}\`}
                                >
                                  {playingAudio === file.url ? <div className="w-2.5 h-2.5 bg-black rounded-sm" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                </button>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-xs font-bold text-white truncate">{file.name}</span>
                                  <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteSystemAudioFile(file.name)}
                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                title="Eliminar archivo"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Hidden Audio Element for Preview */}
                    {playingAudio && (
                      <audio 
                        autoPlay 
                        src={playingAudio} 
                        onEnded={() => setPlayingAudio(null)} 
                        className="hidden" 
                      />
                    )}

                    <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
                      <input
                        type="file"
                        accept="audio/*"
                        id="system-audio-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('audio', file);
                          
                          try {
                            setIsUploadingAudio(true);
                            const res = await fetch('/api/admin/upload-audio', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!res.ok) throw new Error('Error al subir');
                            
                            fetchSystemAudioFiles();
                            alert('Archivo ' + file.name + ' subido correctamente.');
                          } catch (err) {
                            alert('Fallo la subida del archivo');
                          } finally {
                            setIsUploadingAudio(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      <label 
                        htmlFor="system-audio-upload"
                        className={\`cursor-pointer border text-xs font-black uppercase tracking-widest rounded-xl py-3 px-4 text-center transition-all inline-block w-full max-w-xs \${isUploadingAudio ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse cursor-not-allowed' : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'}\`}
                      >
                        {isUploadingAudio ? 'Subiendo...' : 'Subir nuevo archivo de audio'}
                      </label>
                    </div>
                  </div>
                </div>`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', content);
