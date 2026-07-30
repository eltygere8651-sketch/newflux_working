const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
'export type NewsTabType = "updates" | "guides" | "community" | "featured";',
'export type NewsTabType = "updates" | "guides" | "community" | "featured" | "onboarding";'
);

const onboardingConfig = `
  featured: {
    id: "featured" as NewsTabType,
    title: "Destacados",
    shortTitle: "Destacados",
    icon: Star,
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    description: "Explora las novedades más importantes, playlists recomendadas y el contenido que no te puedes perder.",
    colorAccent: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30",
    iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
  onboarding: {
    id: "onboarding" as NewsTabType,
    title: "Onboarding",
    shortTitle: "Onboarding",
    icon: Sparkles,
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    description: "Gestión del Centro de Bienvenida. Publica el onboarding para todos los usuarios y organiza las tarjetas modulares.",
    colorAccent: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  }
};
`;

content = content.replace(`  featured: {
    id: "featured" as NewsTabType,
    title: "Destacados",
    shortTitle: "Destacados",
    icon: Star,
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    description: "Explora las novedades más importantes, playlists recomendadas y el contenido que no te puedes perder.",
    colorAccent: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30",
    iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
};`, onboardingConfig);

fs.writeFileSync(path, content, 'utf8');
