const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetMobile = `              <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-center gap-2 bg-[#090b0a]">

                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="flex-1 min-w-[90px] h-8 bg-[#121212] border border-emerald-500/20 text-[#1ED760] font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-4 h-4 rounded-full object-cover border border-[#1ED760]/30" 
                      referrerPolicy="no-referrer"
                    />
                    <span>Perfil</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                    className="flex-1 min-w-[90px] h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <Shield className="w-3 h-3 stroke-[2.5px]" />
                    <span>Admin</span>
                  </button>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="flex-1 min-w-[90px] h-8 bg-emerald-950/25 border border-[#1ED760]/20 hover:border-[#1ED760]/30 text-[#1ED760] font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <LogOut className="w-3 h-3 stroke-[2.5px]" />
                    <span>Salir</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); setAuthModalOpen(true); }}
                    className="flex-1 min-w-[90px] h-8 bg-[#121212] border border-[#1ED760]/20 hover:border-[#1ED760]/30 text-[#1ED760] font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <LogIn className="w-3 h-3 stroke-[2.5px]" />
                    <span>Entrar</span>
                  </button>
                )}
              </div>`;

const replaceMobile = `              <div className="flex flex-col p-4 gap-2.5 bg-gradient-to-b from-[#090b0a] to-[#0d110f]">
                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-6 h-6 rounded-full object-cover border border-[#1ED760]/30" 
                      referrerPolicy="no-referrer"
                    />
                    <span>Perfil de Usuario</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                    className="w-full h-12 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <Shield className="w-4 h-4 stroke-[2.5px]" />
                    <span>Panel de Administración</span>
                  </button>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="w-full h-12 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5px]" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); setAuthModalOpen(true); }}
                    className="w-full h-12 bg-[#1ED760]/10 hover:bg-[#1ED760]/20 border border-[#1ED760]/30 text-[#1ED760] font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5px]" />
                    <span>Iniciar Sesión</span>
                  </button>
                )}
              </div>`;


const targetDesktop = `            <div className="flex flex-col p-2 gap-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 rounded-2xl">
              {user && (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                  className="h-8 bg-white/5 border border-white/5 text-white font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 hover:bg-white/10"
                >
                  <img 
                    src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                    alt="Perfil" 
                    className="w-4 h-4 rounded-full object-cover border border-[#1ED760]/30" 
                    referrerPolicy="no-referrer"
                  />
                  <span>Perfil</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                  className="h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Admin</span>
                </button>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); logout(); }}
                  className="h-8 bg-emerald-950/25 border border-[#1ED760]/20 hover:border-[#1ED760]/30 text-[#1ED760] font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Salir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); setAuthModalOpen(true); }}
                  className="h-8 bg-[#121212] border border-[#1ED760]/20 hover:border-[#1ED760]/30 text-[#1ED760] font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Entrar</span>
                </button>
              )}
            </div>`;


const replaceDesktop = `            <div className="flex flex-col p-2 gap-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 rounded-2xl w-48">
              {user && (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                  className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                >
                  <img 
                    src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                    alt="Perfil" 
                    className="w-5 h-5 rounded-full object-cover border border-[#1ED760]/30" 
                    referrerPolicy="no-referrer"
                  />
                  <span>Perfil de Usuario</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                  className="h-10 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                >
                  <Shield className="w-4 h-4 stroke-[2.5px]" />
                  <span>Administración</span>
                </button>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); logout(); }}
                  className="h-10 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5px]" />
                  <span>Cerrar Sesión</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); setAuthModalOpen(true); }}
                  className="h-10 bg-[#1ED760]/10 hover:bg-[#1ED760]/20 border border-[#1ED760]/30 text-[#1ED760] font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5px]" />
                  <span>Iniciar Sesión</span>
                </button>
              )}
            </div>`;


code = code.replace(targetMobile, replaceMobile);
code = code.replace(targetDesktop, replaceDesktop);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed menus');
