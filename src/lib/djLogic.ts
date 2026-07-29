import { MusicTrack } from "../types";

export interface DJConfig {
  discoveryLevel: number; // 0 to 100 (for backward compatibility if needed)
  genreMode?: boolean;
  selectedGenre?: string;
  topRatio?: number;
  favRatio?: number;
  discRatio?: number;
}

/**
 * Selects the next track based on the AI DJ logic:
 * - Uses configured or stored ratios for Top Tracks, Favorite Tracks, and Discovery.
 * - Defaults to: 30% Top Songs, 20% Favorite Songs, 50% New Discovery.
 */
export function selectNextDJTrack(
  topTracks: MusicTrack[],
  favorites: MusicTrack[],
  discoveryPool: MusicTrack[],
  config: DJConfig
): MusicTrack | null {
  // If genre mode is active, filter all pools by genre (if a genre is selected)
  let currentTop = topTracks;
  let currentFavs = favorites;
  let currentDisc = discoveryPool;

  if (config.genreMode && config.selectedGenre) {
    const genreFilter = (t: MusicTrack) => 
      t.title?.toLowerCase().includes(config.selectedGenre!.toLowerCase()) || 
      t.artist?.toLowerCase().includes(config.selectedGenre!.toLowerCase());

    currentTop = topTracks.filter(genreFilter);
    currentFavs = favorites.filter(genreFilter);
    currentDisc = discoveryPool.filter(genreFilter);
    
    // If no tracks found with that genre in top/favs, fallback to discovery for that genre
    if (currentTop.length === 0 && currentFavs.length === 0 && currentDisc.length === 0) {
      return null;
    }
  }

  // Determine user parameters with strict fallback to industry standard defaults (60, 25, 15)
  let topRatio = 60;
  let favRatio = 25;
  let discRatio = 15;

  // Retrieve from localStorage if available in browser
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const savedTop = window.localStorage.getItem("fai_top_ratio");
      const savedFav = window.localStorage.getItem("fai_fav_ratio");
      const savedDisc = window.localStorage.getItem("fai_disc_ratio");
      if (savedTop !== null) {
        if (savedTop === "32" || savedTop === "40") topRatio = 60;
        else topRatio = parseInt(savedTop, 10);
      }
      if (savedFav !== null) {
        if (savedFav === "18" || savedFav === "20") favRatio = 25;
        else favRatio = parseInt(savedFav, 10);
      }
      if (savedDisc !== null) {
        if (savedDisc === "50" || savedDisc === "40") discRatio = 15;
        else discRatio = parseInt(savedDisc, 10);
      }
    } catch (e) {
      console.warn("Could not read ratios from localStorage:", e);
    }
  }

  // Override from passed config if explicitly defined
  if (config.topRatio !== undefined) topRatio = config.topRatio;
  if (config.favRatio !== undefined) favRatio = config.favRatio;
  if (config.discRatio !== undefined) discRatio = config.discRatio;

  // Normalize so that the ratios are converted to probabilities summing to 1.0
  const total = topRatio + favRatio + discRatio;
  const wTop = total > 0 ? topRatio / total : 0.60;
  const wFav = total > 0 ? favRatio / total : 0.25;
  const wDisc = total > 0 ? discRatio / total : 0.15;

  const rand = Math.random();

  let selected: MusicTrack | null = null;

  if (rand < wDisc && currentDisc.length > 0) {
    selected = currentDisc[Math.floor(Math.random() * currentDisc.length)];
  } else if (rand < wDisc + wTop && currentTop.length > 0) {
    selected = currentTop[Math.floor(Math.random() * currentTop.length)];
  } else if (currentFavs.length > 0) {
    selected = currentFavs[Math.floor(Math.random() * currentFavs.length)];
  } else {
    // Fallback logic if some lists are empty
    let fallbackPool = [...currentTop, ...currentFavs, ...currentDisc];
    if (fallbackPool.length === 0 && !config.genreMode) {
      fallbackPool = [...topTracks, ...favorites, ...discoveryPool];
    }
    if (fallbackPool.length === 0) return null;
    selected = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  if (selected && !selected.url) {
    const dbFallback = discoveryPool.find(t => t.id === selected!.id);
    if (dbFallback && dbFallback.url) {
      selected = { ...selected, url: dbFallback.url };
    } else {
      selected = { ...selected, url: `https://www.youtube.com/watch?v=${selected.id}` };
    }
  }

  return selected;
}

export const FLUX_PAYOLA = [
  "¡Recuerda que FLX Radio es la casa del mejor sonido! No te despegues.",
  "FLX Radio: donde el ritmo nunca muere y la IA siempre pincha lo mejor.",
  "Si te gusta lo que escuchas, comparte FLX Radio con tus amigos.",
  "Aquí en FLX Radio, siempre tenemos lo mejor para tu entrenamiento.",
  "Tu DJ, mezclando para ti en FLX Radio."
];

export const DJ_GENRES = [
  "La mezcla de Sofia",
  "Variado Mix",
  "Pop",
  "Rock",
  "Reggaeton",
  "Trap",
  "Rap",
  "Hip-Hop",
  "Electrónica",
  "House",
  "Techno",
  "Dance",
  "Indie",
  "Alternativo",
  "Latino",
  "Bachata",
  "Salsa",
  "Merengue",
  "Flamenco",
  "R&B",
  "Soul",
  "Country",
  "Metal",
  "Jazz",
  "Lo-Fi",
  "Chill"
];

export function getGenreQueries(
  genre: string,
  userTopTracks: MusicTrack[] = [],
  userFavorites: MusicTrack[] = []
): string[] {
  const normalized = genre.trim().toLowerCase();

  const topArtists = Array.from(
    new Set(
      [...userTopTracks, ...userFavorites]
        .map((t) => t.artist)
        .filter((a): a is string => Boolean(a && a !== "Desconocido" && a !== "Variado" && !a.includes("YouTube") && !a.includes("Topic")))
    )
  ).slice(0, 5);

  const eraSuffixes = ["2026 exitos", "2024-2026 trending", "2015-2023 hits", "2000-2015 clasicos", "official audio"];

  if (normalized === "la mezcla de sofia" || normalized === "variado mix" || normalized === "variado") {
    const baseQueries = [
      "novedades musicales pop reggaeton urbana 2026",
      "top exitos actuales en español e ingles 2026",
      "billboard hot 100 y los 40 principales 2026",
      "exitos pop latino urbano 2000 2026 official audio",
      "canciones mas escuchadas españa latinoamerica 2026",
      "greatest global pop hits 2000-2026 official audio",
      "tendencias musicales 2026 exitos mix",
      "top hits mundiales 2010 2020 2026"
    ];

    if (topArtists.length > 0) {
      topArtists.forEach((artist) => {
        const randomEra = eraSuffixes[Math.floor(Math.random() * eraSuffixes.length)];
        baseQueries.push(`${artist} ${randomEra}`);
        baseQueries.push(`${artist} canciones exitos`);
      });
    }

    return baseQueries;
  }

  const genreQueryMap: Record<string, string[]> = {
    reggaeton: [
      "reggaeton actual 2026 exitos audio oficial",
      "reggaeton latinoamerica y españa 2024 2026",
      "reggaeton clasicos 2000 2015 perreo antiguo",
      "top reggaeton puerto rico colombia 2026",
      "reggaeton lento suave exitos 2000-2026",
      "exitos reggaeton nuevo 2026 oficial"
    ],
    pop: [
      "pop en español exitos 2000-2026",
      "pop latino novedades 2026 audio oficial",
      "pop billboard hot 100 hits 2000-2026",
      "pop 2000s 2010s clasicos e inolvidables",
      "top pop canciones internacionales 2026"
    ],
    rock: [
      "rock en español clasicos y actuales 2000-2026",
      "rock internacional greatest hits 2000-2026",
      "alternative rock hits 2000s 2010s 2020s",
      "rock argentino y español exitos inolvidables",
      "hard rock & indie rock top hits"
    ],
    trap: [
      "trap latino exitos 2016-2026",
      "trap en español españa puerto rico 2026",
      "trap americano rap hip hop hits 2020-2026",
      "trap urbano novedades 2026 official audio"
    ],
    rap: [
      "rap en español exitos 2000-2026",
      "hip hop rap internacional 2000-2026 hits",
      "rap rap latino underground y comercial 2026",
      "top rap songs 2000s 2010s 2020s"
    ],
    "hip-hop": [
      "hip hop rap top hits 2000-2026",
      "hip hop 2000s 2010s classic bangers",
      "hip hop en español latinoamerica españa",
      "billboard hip hop R&B hits 2026"
    ],
    "hip hop": [
      "hip hop rap top hits 2000-2026",
      "hip hop 2000s 2010s classic bangers",
      "hip hop en español latinoamerica españa",
      "billboard hip hop R&B hits 2026"
    ],
    electrónica: [
      "electronic dance music hits 2000-2026",
      "edm festival bangers 2010-2026",
      "musica electronica exitos 2000-2026",
      "top electronic dance tracks official audio"
    ],
    electronica: [
      "electronic dance music hits 2000-2026",
      "edm festival bangers 2010-2026",
      "musica electronica exitos 2000-2026",
      "top electronic dance tracks official audio"
    ],
    house: [
      "house music official audio 2000-2026",
      "deep house tech house hits 2020-2026",
      "progressive house festival anthems 2010-2026",
      "funky house & disco house classics"
    ],
    techno: [
      "techno peak time driving 2020-2026",
      "melodic techno & industrial hits 2000-2026",
      "techno festival tracklist official audio",
      "club techno anthems 2010-2026"
    ],
    dance: [
      "dance pop hits 2000-2026",
      "eurodance 2000s & modern dance 2026",
      "top dance tracks festival radio",
      "exitos dance en español e ingles"
    ],
    indie: [
      "indie pop rock hits 2000-2026",
      "indie en español españa latinoamerica 2000-2026",
      "indie alternative top songs 2010-2026",
      "indie chill & bedroom pop hits"
    ],
    alternativo: [
      "musica alternativa en español e ingles 2000-2026",
      "alternative rock pop hits 2000-2026",
      "lo mejor del alternativo latino y mundial",
      "indie alternativo novedades 2026"
    ],
    latino: [
      "musica latina exitos 2000-2026",
      "pop latino reggaeton bachata salsa 2026",
      "canciones latinas mas populares 2000-2026",
      "top hits latinoamerica españa 2026"
    ],
    bachata: [
      "bachata exitos 2000-2026 romeo aventura prince royce",
      "bachata romantica y moderna 2000-2026",
      "bachatareggae & clasicos de la bachata",
      "top bachata republica dominicana 2026"
    ],
    salsa: [
      "salsa clasicos y exitos 2000-2026",
      "salsa romantica Marc Anthony Grupo Niche",
      "salsa brava y moderna 2000-2026",
      "top salsa latina 2026 official audio"
    ],
    merengue: [
      "merengue bailable exitos 2000-2026",
      "merengue clasicos 2000s Juan Luis Guerra Olga Tañon",
      "merengue urbano y tradicional 2026"
    ],
    flamenco: [
      "flamenco fusion urbano exitos 2000-2026",
      "flamenco pop rumba Rosalía C Tangana Niña Pastori",
      "flamenco chill y clasicos modernos 2000-2026"
    ],
    "r&b": [
      "r&b soul hits 2000-2026 billboard",
      "smooth r&b classics 2000s 2010s 2020s",
      "contemporary r&b official audio 2026"
    ],
    soul: [
      "neo soul & modern soul hits 2000-2026",
      "soul classic and contemporary anthems",
      "r&b soul top tracks official audio"
    ],
    country: [
      "country music top hits 2000-2026",
      "country pop & modern country billboard 2026",
      "country classics 2000s 2010s 2020s"
    ],
    metal: [
      "metal heavy metal metalcore hits 2000-2026",
      "alternative metal & hard rock 2000s 2010s 2020s",
      "top metal tracks official audio"
    ],
    jazz: [
      "smooth jazz & modern jazz 2000-2026",
      "nu jazz & jazztronica relaxed vibes",
      "jazz classics 2000s 2010s 2020s"
    ],
    "lo-fi": [
      "lofi hip hop beats 2020-2026 chill study",
      "lofi chillhop relaxed aesthetic music",
      "lo fi beats 2000-2026 official audio"
    ],
    lofi: [
      "lofi hip hop beats 2020-2026 chill study",
      "lofi chillhop relaxed aesthetic music",
      "lo fi beats 2000-2026 official audio"
    ],
    chill: [
      "chillout lounge music 2000-2026",
      "chill pop & r&b relaxed hits 2026",
      "ambient chill vibes 2000-2026"
    ]
  };

  const keyMatch = Object.keys(genreQueryMap).find((k) => normalized.includes(k));
  if (keyMatch && genreQueryMap[keyMatch]) {
    return genreQueryMap[keyMatch];
  }

  return [
    `${genre} novedades 2026 official audio`,
    `${genre} exitos 2020-2026`,
    `${genre} top hits 2000-2015`,
    `mejores canciones ${genre} 2000-2026`,
    `top ${genre} mundial official music video`
  ];
}

export const isReasonableTrack = (duration: string | undefined | null, title: string | undefined | null): boolean => {
  if (title) {
    const t = title.toLowerCase();
    if (
      t.includes("compilation") || 
      t.includes("compilacion") ||
      t.includes("compilació") ||
      t.includes("mashup") || 
      t.includes("megamix") || 
      t.includes("1 hour") || 
      t.includes("1 hora") ||
      t.includes("2 hours") ||
      t.includes("2 horas") ||
      t.includes("10 hours") ||
      t.includes("10 horas") ||
      t.includes("full album") ||
      t.includes("album completo") ||
      t.includes("disco completo") ||
      t.includes("discografia") ||
      t.includes("best of") ||
      t.includes("top 50") ||
      t.includes("top 100") ||
      t.includes("top 40") ||
      t.includes("mas vistas") ||
      t.includes("más vistas") ||
      t.includes("las canciones mas") ||
      t.includes("los exitos de") ||
      t.includes("los éxitos de") ||
      t.includes("en vivo") ||
      t.includes("live at") ||
      t.includes("concert") ||
      t.includes("playlist") ||
      t.includes("tutorial") ||
      t.includes("karaoke") ||
      t.includes("instrumental version") ||
      t.includes("reaction") ||
      t.includes("review") ||
      t.includes("podcast") ||
      t.includes("8d audio") ||
      t.includes("bass boosted") ||
      t.includes("speed up") ||
      t.includes("nightcore")
    ) {
      return false;
    }
  }

  if (duration && duration !== "N/A" && duration !== "0:00") {
    const parts = duration.split(":");
    if (parts.length >= 3) return false;
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (mins > 7) return false;
      if (mins === 0 && secs < 45) return false;
    }
  }
  
  return true;
};
