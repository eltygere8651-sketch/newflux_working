const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const newTabStr = `
          <button
            onClick={() => setActiveTab("analytics")}
            className={\`shrink-0 flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none \${
              activeTab === "analytics"
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }\`}
          >
            <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Analytics</span>
          </button>
        </div>
`;

code = code.replace(/<\/span>\s*<\/button>\s*<\/div>/, '</span>\n          </button>' + newTabStr);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
