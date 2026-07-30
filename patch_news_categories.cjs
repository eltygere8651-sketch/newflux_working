const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
'                  { id: "guia", label: "Guías & Videos", icon: MonitorPlay, badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },',
'                  { id: "guia", label: "Guías & Videos", icon: MonitorPlay, badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },\n                  { id: "onboarding", label: "Onboarding (Bienvenida)", icon: Sparkles, badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },'
);

fs.writeFileSync(path, content, 'utf8');
