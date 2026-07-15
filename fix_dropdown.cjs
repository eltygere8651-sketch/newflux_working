const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetMenu = `        {/* UNIFIED MENU */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+10px)] left-4 z-50"
            >
              <div className="flex flex-col p-2 gap-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 rounded-2xl w-48 bg-[#090b0a]/95 backdrop-blur-xl">
                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
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
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                    className="h-10 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                  >
                    <Shield className="w-4 h-4 stroke-[2.5px]" />
                    <span>Admin</span>
                  </button>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); logout(); }}
                    className="h-10 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5px]" />
                    <span>Salir</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                    className="h-10 bg-[#1ED760]/10 hover:bg-[#1ED760]/20 border border-[#1ED760]/30 text-[#1ED760] font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-start px-3 gap-2.5 active:scale-95"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5px]" />
                    <span>Entrar</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>`;

const unifiedMenu = `        {/* UNIFIED MENU */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+5px)] left-4 sm:left-6 z-50 origin-top-left"
            >
              <div className="flex flex-col p-1 gap-0.5 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/10 rounded-lg w-44 bg-[#121212]/95 backdrop-blur-2xl">
                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="w-full h-9 bg-transparent hover:bg-white/5 text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-4 h-4 rounded-full object-cover border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                    <span>Perfil</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-admin-panel')); }}
                    className="w-full h-9 bg-transparent hover:bg-emerald-500/10 text-emerald-400 font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <Shield className="w-4 h-4 stroke-[2px]" />
                    <span>Admin</span>
                  </button>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); logout(); }}
                    className="w-full h-9 bg-transparent hover:bg-white/5 text-white/70 hover:text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <LogOut className="w-4 h-4 stroke-[2px]" />
                    <span>Salir</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                    className="w-full h-9 bg-transparent hover:bg-white/5 text-white/90 hover:text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <LogIn className="w-4 h-4 stroke-[2px]" />
                    <span>Entrar</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>`;

code = code.replace(targetMenu, unifiedMenu);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed dropdown style");
