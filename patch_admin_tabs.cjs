const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// Import LazyAnalyticsAdmin
const analyticsImport = `import AnalyticsAdmin from "./AnalyticsAdmin";\nimport { BarChart2 } from "lucide-react";\n`;
if (!code.includes('import AnalyticsAdmin')) {
  code = code.replace(/import \{ db, auth \} from "\.\.\/lib\/firebase";/, analyticsImport + 'import { db, auth } from "../lib/firebase";');
}

// Update state type
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<"users" \| "notifications" \| "monitor">/,
  'const [activeTab, setActiveTab] = useState<"users" | "notifications" | "monitor" | "analytics">'
);

// Add tab button
const newTabStr = `
          <button
            onClick={() => setActiveTab("analytics")}
            className={\`shrink-0 flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none \${
              activeTab === "analytics"
                ? "bg-flux/15 text-flux border border-flux/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }\`}
          >
            <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Analytics</span>
          </button>
        </div>
`;

code = code.replace(/<span>Monitor<\/span>\s*<\/button>\s*<\/div>/, '<span>Monitor</span>\n          </button>' + newTabStr);

// Add Analytics render area
const analyticsRender = `
          {activeTab === "analytics" && (
            <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 h-[calc(100vh-200px)] overflow-y-auto">
              <AnalyticsAdmin />
            </div>
          )}
`;
code = code.replace(/\{activeTab === "monitor" && \(/, analyticsRender + '\n          {activeTab === "monitor" && (');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
