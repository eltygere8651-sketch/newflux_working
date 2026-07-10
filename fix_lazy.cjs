const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');
code = code.replace(
  'const LazyPodcastView = React.lazy(() =>\n  import("./PodcastView").then((m) => ({ default: m.PodcastView })),\n);',
  'const LazyPodcastView = React.lazy(() =>\n  import("./PodcastView").then((m) => ({ default: m.PodcastView })),\n);\nconst LazyFluxKaraoke = React.lazy(() => import("./FluxKaraoke"));'
);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
