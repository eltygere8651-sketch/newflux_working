const fs = require('fs');

let content = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const audioUploadUI = `

                {/* AUDIO UPLOAD FOR SYSTEM ANNOUNCEMENTS */}
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
                </div>
`;

content = content.replace(`                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "notifications" && (`, `                    </div>
                  )}
                </div>
${audioUploadUI}
              </>
            )}

            {activeTab === "notifications" && (`);

// Check if Mic is imported from lucide-react
if (!content.includes("Mic,")) {
  content = content.replace("Trash,", "Trash,\n  Mic,");
}

fs.writeFileSync('src/components/UserManagementAdmin.tsx', content);
