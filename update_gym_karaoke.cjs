const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// 1. Add Lazy component definition
const lazyDef = `const LazyPodcastView = React.lazy(() => import("./PodcastView"));`;
const newLazyDef = `${lazyDef}\nconst LazyFluxKaraoke = React.lazy(() => import("./FluxKaraoke"));`;
code = code.replace(lazyDef, newLazyDef);

// 2. Add to Union type (if exists locally, but typescript is loose, but let's check)
code = code.replace(
  /"playlist" \| "search" \| "queue" \| "entertainment" \| "radio-fai"/g,
  '"playlist" | "search" | "queue" | "entertainment" | "radio-fai" | "karaoke"'
);

// 3. Update conditions
// Replace trackListTab === "entertainment" || trackListTab === "radio-fai" with including "karaoke"
code = code.replace(
  /trackListTab === "entertainment" \|\| trackListTab === "radio-fai"/g,
  'trackListTab === "entertainment" || trackListTab === "radio-fai" || trackListTab === "karaoke"'
);

code = code.replace(
  /trackListTab !== "entertainment" && trackListTab !== "radio-fai"/g,
  'trackListTab !== "entertainment" && trackListTab !== "radio-fai" && trackListTab !== "karaoke"'
);

// Specifically for the PLAYER BAR hidden condition
code = code.replace(
  /trackListTab === "entertainment" \|\| trackListTab === "radio-fai" \? "hidden"/g,
  'trackListTab === "entertainment" || trackListTab === "radio-fai" || trackListTab === "karaoke" ? "hidden"'
);

// 4. Add the button in the GLOBAL TABS
const radioTabBtn = `<button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            
            setTrackListTab("radio-fai");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={\`relative shrink-0 px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer border snap-start flex items-center justify-center \${
            trackListTab === "radio-fai" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }\`}
        >
          <span className="flex items-center gap-1.5">
            <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm">FLUX</span>
            <Radio className="w-3.5 h-3.5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)] animate-pulse" />
          </span>
          {Date.now() < new Date("2026-07-06T17:16:26Z").getTime() && (
            <span className="absolute -top-1.5 -right-2 px-1 py-[1px] bg-red-500 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(239,68,68,0.6)] rotate-[8deg] animate-pulse">
              Novedad
            </span>
          )}
        </button>`;

const karaokeTabBtn = `
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            
            setTrackListTab("karaoke");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={\`relative shrink-0 px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer border snap-start flex items-center justify-center \${
            trackListTab === "karaoke" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-emerald-600 text-white border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }\`}
        >
          <span className="flex items-center gap-1.5">
            Flux Karaoke
            <Mic className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </span>
        </button>`;

code = code.replace(radioTabBtn, radioTabBtn + karaokeTabBtn);

// 5. Add the rendering inside the main area
const renderPodcast = `{trackListTab === "entertainment" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyPodcastView
                        isVisible={true}
                        pauseBackgroundMusic={() => {
                          if (isPlaying) togglePlayback();
                        }}
                      />
                    </React.Suspense>
                  ) : trackListTab === "radio-fai" ? (`

const renderKaraoke = `{trackListTab === "karaoke" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyFluxKaraoke />
                    </React.Suspense>
                  ) : trackListTab === "entertainment" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyPodcastView
                        isVisible={true}
                        pauseBackgroundMusic={() => {
                          if (isPlaying) togglePlayback();
                        }}
                      />
                    </React.Suspense>
                  ) : trackListTab === "radio-fai" ? (`

code = code.replace(renderPodcast, renderKaraoke);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Updated GymMusicPlayer.tsx with Karaoke module");
