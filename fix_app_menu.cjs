const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldMenu = `        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="sm:hidden overflow-hidden w-full border-t border-white/5 bg-[#090b0a]"
            >
              <div className="flex flex-col p-4 gap-2.5 bg-gradient-to-b from-[#090b0a] to-[#0d110f]">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>`;

const newMenu = `        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="sm:hidden absolute top-full left-0 right-0 overflow-hidden w-full border-b border-white/5 bg-[#090b0a]/95 backdrop-blur-xl shadow-2xl z-40"
            >
              <div className="flex flex-col p-3 gap-1.5">
                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="w-full h-10 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/5 text-white font-medium uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-5 h-5 rounded-full object-cover border border-[#1ED760]/30" 
                      referrerPolicy="no-referrer"
                    />
                    <span>Perfil</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                    className="w-full h-10 bg-transparent hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-emerald-400 font-medium uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <Shield className="w-4 h-4 stroke-[2.5px]" />
                    <span>Admin</span>
                  </button>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="w-full h-10 bg-transparent hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-400 font-medium uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5px]" />
                    <span>Salir</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); setAuthModalOpen(true); }}
                    className="w-full h-10 bg-transparent hover:bg-[#1ED760]/10 border border-transparent hover:border-[#1ED760]/20 text-[#1ED760] font-medium uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-start px-4 gap-3 active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5px]" />
                    <span>Entrar</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>`;

code = code.replace(oldMenu, newMenu);

const oldInstall = `className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all border border-amber-300/40 whitespace-nowrap"`;
const newInstall = `className="flex items-center gap-1.5 bg-[#080809] text-[#1ED760] px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-wider shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all border border-[#1ED760]/30 whitespace-nowrap"`;

code = code.replace(oldInstall, newInstall);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed styling for app');
