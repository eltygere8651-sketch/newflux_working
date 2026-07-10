const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// 1. Add Lazy import
if (!code.includes("LazyFluxKaraoke")) {
    code = code.replace(
        'const LazyPodcastView = React.lazy(() => import("./PodcastView"));',
        'const LazyPodcastView = React.lazy(() => import("./PodcastView"));\nconst LazyFluxKaraoke = React.lazy(() => import("./FluxKaraoke"));'
    );
}

// 2. Fix the render logic
const targetString = `{trackListTab === "entertainment" ? (`;
if (code.includes(targetString) && !code.includes('trackListTab === "karaoke" ? (')) {
    const replacement = `{trackListTab === "karaoke" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyFluxKaraoke />
                    </React.Suspense>
                  ) : trackListTab === "entertainment" ? (`;
    
    code = code.replace(targetString, replacement);
    console.log("Successfully injected Karaoke render logic!");
}

// Ensure the condition at 6836 also checks karaoke!
code = code.replace(
    /trackListTab === "entertainment" \|\|\n\s*trackListTab === "radio-fai" \? \(/g,
    'trackListTab === "entertainment" ||\n          trackListTab === "karaoke" ||\n          trackListTab === "radio-fai" ? ('
);
// Also inline check if it was on one line
code = code.replace(
    /trackListTab === "entertainment" \|\| trackListTab === "radio-fai" \? \(/g,
    'trackListTab === "entertainment" || trackListTab === "karaoke" || trackListTab === "radio-fai" ? ('
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Karaoke rendering fixed");
