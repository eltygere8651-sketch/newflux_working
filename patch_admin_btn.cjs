const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const importAnalyticsAdmin = `const LazyAnalyticsAdmin = React.lazy(() => import("./AnalyticsAdmin"));\n`;
if (!code.includes('LazyAnalyticsAdmin')) {
  code = code.replace(/const LazyUserManagementAdmin/, importAnalyticsAdmin + 'const LazyUserManagementAdmin');
}

const isAnalyticsAdminOpenState = `  const [isAnalyticsAdminOpen, setIsAnalyticsAdminOpen] = useState(false);\n`;
if (!code.includes('isAnalyticsAdminOpen')) {
  code = code.replace(/const \[isAdminPanelOpen, setIsAdminPanelOpen\] = useState\(false\);/, 'const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);\n' + isAnalyticsAdminOpenState);
}

// Ensure ADMIN_UID check
const adminUidCheck = `
              {user?.uid === 'ADMIN_UID' && (
                <button
                  onClick={() => setIsAnalyticsAdminOpen(true)}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4 text-flux" />
                  Analytics Dashboard
                </button>
              )}
`;

if (!code.includes('setIsAnalyticsAdminOpen(true)')) {
  code = code.replace(/(<button[^>]+onClick={\(\) => setIsAdminPanelOpen\(true\)}[^>]*>[\s\S]*?<\/button>)/, '$1\n' + adminUidCheck);
}

// Render the modal
const analyticsModal = `
      <AnimatePresence>
        {isAnalyticsAdminOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm overflow-y-auto"
          >
            <div className="min-h-screen p-4 md:p-8">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsAnalyticsAdminOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <Suspense fallback={
                <div className="flex justify-center items-center h-[50vh]">
                  <Loader2 className="w-8 h-8 animate-spin text-flux" />
                </div>
              }>
                <LazyAnalyticsAdmin />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

if (!code.includes('isAnalyticsAdminOpen &&')) {
  code = code.replace(/(<AnimatePresence>\s*{isAdminPanelOpen && \([\s\S]*?<\/AnimatePresence>)/, '$1\n' + analyticsModal);
}

// we need to make sure BarChart2 is imported
if (!code.includes('BarChart2')) {
  code = code.replace(/import {([^}]+)} from "lucide-react";/, 'import {$1, BarChart2} from "lucide-react";');
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
