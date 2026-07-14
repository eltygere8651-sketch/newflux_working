const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove the old float
const oldFloat = `      {/* --- PWA ONE-CLICK INSTALL FLOAT --- */}
      <AnimatePresence>
        {canShowInstallHelper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-36 right-4 sm:bottom-10 sm:right-10 z-[90] flex justify-end pointer-events-none"
          >
            <button
              onClick={handleInstallPress}
              className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-[#1ED760] to-emerald-500 text-black px-4 py-2.5 rounded-full font-black uppercase text-[10px] sm:text-xs tracking-wider shadow-[0_8px_25px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 transition-all border border-emerald-400/30"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Instalar App</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(oldFloat, "");

// 2. Put it right below the bell
const newBellArea = `          {/* RIGHT: PREMIUM BELL NOTIFICATIONS */}
          <div className="flex flex-col items-end justify-center relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(true);
                setHasUnread(false);
              }}
              className="relative flex items-center justify-center p-2 rounded-full border border-white/10 text-white bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.4)] group"
              title="Avisos e importantes"
            >
              <Bell className="w-4 h-4 group-hover:text-amber-400 transition-colors shrink-0" />
              {hasUnread && (
                <>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping opacity-75" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border border-[#080809] rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse" />
                </>
              )}
            </button>
            <AnimatePresence>
              {canShowInstallHelper && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-[calc(100%+10px)] right-0 z-[100]"
                >
                  <button
                    onClick={handleInstallPress}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all border border-amber-300/40 whitespace-nowrap"
                  >
                    <Download className="w-3 h-3" />
                    <span>Instalar</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>`;

code = code.replace(/          \{\/\* RIGHT: PREMIUM BELL NOTIFICATIONS \*\/\}[\s\S]*?<\/button>\n          <\/div>/, newBellArea);

fs.writeFileSync('src/App.tsx', code);
console.log('Moved install button below bell');
