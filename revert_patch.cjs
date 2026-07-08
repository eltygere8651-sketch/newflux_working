const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(/const LazyAnalyticsAdmin = React\.lazy\(\(\) => import\("\.\/AnalyticsAdmin"\)\);\n/g, '');
code = code.replace(/  const \[isAnalyticsAdminOpen, setIsAnalyticsAdminOpen\] = useState\(false\);\n/g, '');

const adminBtnPattern = /              \{user\?\.uid === 'ADMIN_UID' && \(\s*<button\s*onClick=\{\(\) => setIsAnalyticsAdminOpen\(true\)\}\s*className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white\/5 transition-colors flex items-center gap-2"\s*>\s*<BarChart2 className="w-4 h-4 text-flux" \/>\s*Analytics Dashboard\s*<\/button>\s*\)\}\n/g;
code = code.replace(adminBtnPattern, '');

const modalPattern = /\s*<AnimatePresence>\s*\{isAnalyticsAdminOpen && \(\s*<motion\.div\s*initial=\{\{ opacity: 0, y: 20 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*exit=\{\{ opacity: 0, y: 20 \}\}\s*className="fixed inset-0 z-\[100\] bg-black\/95 backdrop-blur-sm overflow-y-auto"\s*>\s*<div className="min-h-screen p-4 md:p-8">\s*<div className="flex justify-end mb-4">\s*<button\s*onClick=\{\(\) => setIsAnalyticsAdminOpen\(false\)\}\s*className="p-2 bg-white\/10 hover:bg-white\/20 rounded-full text-white transition-colors"\s*>\s*<X className="w-6 h-6" \/>\s*<\/button>\s*<\/div>\s*<Suspense fallback=\{\s*<div className="flex justify-center items-center h-\[50vh\]">\s*<Loader2 className="w-8 h-8 animate-spin text-flux" \/>\s*<\/div>\s*\}\>\s*<LazyAnalyticsAdmin \/>\s*<\/Suspense>\s*<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/g;
code = code.replace(modalPattern, '');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
