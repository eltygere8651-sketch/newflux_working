export const maxDuration = 60;
import { Innertube, UniversalCache } from 'youtubei.js';

const ytClients = new Map<string, any>();
const exploreCache = new Map<string, { data: any; timestamp: number }>();
const EXPLORE_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const PIPED_INSTANCES = [
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.lunar.icu',
];

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

const upgradeYtThumb = (url?: string) => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('googleusercontent.com')) {
    return url
      .replace(/=w\d+-h\d+[^&\s]*/, '=w544-h544-l90-rj')
      .replace(/=s\d+[^&\s]*/, '=s544');
  }
  return url;
};

const extractThumbFromList = (list: any[]): string => {
  if (!Array.isArray(list) || list.length === 0) return '';
  const raw = list[list.length - 1]?.url || list[0]?.url || '';
  return upgradeYtThumb(raw);
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const country = ((req.query?.country as string) || 'ES').toUpperCase();
  const forceRefresh = req.query?.refresh === '1';

  // Edge CDN caching for Vercel Hobby (30 min shared CDN cache across users; bypass only on explicit refresh=1)
  if (forceRefresh) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600'
    );
    res.setHeader(
      'CDN-Cache-Control',
      'public, s-maxage=1800, stale-while-revalidate=3600'
    );
  }

  const countryMap: Record<string, string> = {
    GLOBAL: 'Global',
    US: 'Estados Unidos',
    ES: 'España',
    MX: 'México',
    AR: 'Argentina',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Perú',
    GB: 'Reino Unido',
    DO: 'República Dominicana',
    DE: 'Alemania',
    FR: 'Francia',
    IT: 'Italia',
  };
  const countryName = countryMap[country] || 'España';

  const cached = exploreCache.get(country);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < EXPLORE_CACHE_TTL) {
    return res.json(cached.data);
  }

  let ytCountry = ytClients.get(country);
  if (!ytCountry) {
    try {
      ytCountry = await withTimeout(
        Innertube.create({
          gl: country === 'GLOBAL' ? 'US' : country,
          hl: 'es',
          cache: new UniversalCache(false),
        } as any),
        4000,
        null
      );
      if (!ytCountry) {
        return res.status(503).json({ error: 'YouTube initialization timeout' });
      }
      ytClients.set(country, ytCountry);
    } catch (error) {
      console.error('Explore: YT initialize failed', error);
      return res.status(503).json({ error: 'YouTube unavailable' });
    }
  }

  const parseInnertubeItem = (p: any): any => {
    try {
      if (!p) return null;
      let id =
        p.content_id ||
        p.id?.toString() ||
        p.endpoint?.payload?.videoId ||
        p.endpoint?.payload?.browseId ||
        p.playlist_id?.toString() ||
        '';
      if (p.type === 'Playlist' || p.type === 'LockupView') {
        id = p.id || p.playlist_id || p.content_id || id;
      }
      if (!id) return null;
      const cleanId = id.replace(/^VL/, '');

      let title =
        p.metadata?.title?.text ||
        p.title?.text ||
        (typeof p.title === 'string' ? p.title : p.title?.toString()) ||
        p.name ||
        '';
      if (!title && p.flex_columns && p.flex_columns.length > 0) {
        title =
          p.flex_columns[0].title?.text ||
          p.flex_columns[0].title?.toString() ||
          '';
      }
      if (!title || title === '[object Object]') return null;

      let author = '';
      if (p.type === 'LockupView') {
        author =
          p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text
            ?.text || '';
        if (
          !author &&
          p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text
            ?.runs?.[0]?.text
        ) {
          author =
            p.metadata.metadata.metadata_rows[0].metadata_parts[0].text.runs[0]
              .text;
        }
      } else {
        if (Array.isArray(p.artists) && p.artists.length > 0) {
          author = p.artists
            .map((a: any) => a.name)
            .filter(Boolean)
            .join(', ');
        } else if (Array.isArray(p.authors) && p.authors.length > 0) {
          author = p.authors
            .map((a: any) => a.name)
            .filter(Boolean)
            .join(', ');
        } else if (p.author) {
          author = typeof p.author === 'string' ? p.author : p.author.name || '';
        } else if (Array.isArray(p.subtitle?.runs)) {
          author = p.subtitle.runs
            .map((r: any) => r.text)
            .join('')
            .split('•')[0]
            .trim();
        } else if (p.flex_columns && p.flex_columns.length > 1) {
          author =
            p.flex_columns[1].title?.runs?.[0]?.text ||
            p.flex_columns[1].title?.text ||
            '';
        }
      }

      let thumbnail = '';
      if (p.content_image?.primary_thumbnail?.image?.length > 0) {
        thumbnail = extractThumbFromList(
          p.content_image.primary_thumbnail.image
        );
      } else if (p.thumbnail?.contents?.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnail.contents);
      } else if (Array.isArray(p.thumbnail) && p.thumbnail.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnail);
      } else if (p.thumbnails?.length > 0) {
        thumbnail = extractThumbFromList(p.thumbnails);
      } else if (typeof p.thumbnail === 'string') {
        thumbnail = upgradeYtThumb(p.thumbnail);
      }

      if (!thumbnail && cleanId.length === 11) {
        thumbnail = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
      }

      const pageType =
        p.endpoint?.payload?.browseEndpointContextSupportedConfigs
          ?.browseEndpointContextMusicConfig?.pageType || '';
      if (
        cleanId.startsWith('MPED') ||
        pageType === 'MUSIC_PAGE_TYPE_NON_MUSIC_AUDIO_TRACK_PAGE'
      ) {
        return null;
      }

      const isPlaylist =
        cleanId.startsWith('PL') ||
        cleanId.startsWith('RDCLAK') ||
        cleanId.startsWith('OLAK') ||
        cleanId.startsWith('MPRE') ||
        p.type === 'Playlist' ||
        p.type === 'LockupView' ||
        id.startsWith('VL') ||
        (!!p.endpoint?.payload?.browseId &&
          p.endpoint?.payload?.browseId !== cleanId);

      if (!isPlaylist && !/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
        return null;
      }

      return {
        id: cleanId,
        title,
        artist: author || 'YouTube Music',
        duration: isPlaylist ? 'Playlist' : p.duration?.text || 'N/A',
        url: isPlaylist
          ? `https://music.youtube.com/playlist?list=${cleanId}`
          : `https://www.youtube.com/watch?v=${cleanId}`,
        thumbnail,
        isPlaylist,
        subType: isPlaylist ? 'playlist' : 'cancion',
      };
    } catch {
      return null;
    }
  };

  const dedupeItems = (items: any[], limit = 20) => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const item of items) {
      if (!item || !item.id || !item.title) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  };

  try {
    const currentYear = new Date().getFullYear();
    const chartCountry = country === 'GLOBAL' ? 'ZZ' : country;

    const [
      chartsRes,
      musicExploreRes,
      topHitsSearchRes,
      viralSearchRes,
      popSearchRes,
    ] = await Promise.all<any>([
      withTimeout(
        ytCountry.actions
          .execute('/browse', {
            browseId: 'FEmusic_charts',
            client: 'YTMUSIC',
            formData: { selectedValues: [chartCountry] },
          })
          .catch(() => null),
        5000,
        null
      ),
      withTimeout(ytCountry.music.getExplore().catch(() => null), 5000, null),
      withTimeout(
        ytCountry.music
          .search(`Top Hits ${countryName} ${currentYear}`, { type: 'playlist' })
          .catch(() => null),
        5000,
        null
      ),
      withTimeout(
        ytCountry.music
          .search(`Tendencias Viral ${countryName} ${currentYear}`, {
            type: 'playlist',
          })
          .catch(() => null),
        5000,
        null
      ),
      withTimeout(
        ytCountry.music
          .search(`Pop Hits ${countryName}`, { type: 'playlist' })
          .catch(() => null),
        5000,
        null
      ),
    ]);

    const chartPlaylists: any[] = [];
    try {
      const contents =
        chartsRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]
          ?.tabRenderer?.content?.sectionListRenderer?.contents;
      if (contents) {
        for (const c of contents) {
          if (c.musicCarouselShelfRenderer) {
            const shelfItems = c.musicCarouselShelfRenderer.contents || [];
            shelfItems.forEach((i: any) => {
              const title =
                i.musicResponsiveListItemRenderer?.flexColumns?.[0]
                  ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
                  ?.text || i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text;
              let pid =
                i.musicResponsiveListItemRenderer?.overlay
                  ?.musicItemThumbnailOverlayRenderer?.content
                  ?.musicPlayButtonRenderer?.playNavigationEndpoint
                  ?.watchEndpoint?.playlistId ||
                i.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint
                  ?.browseId;
              if (pid && pid.startsWith('VL')) pid = pid.replace(/^VL/, '');
              const thumbList =
                i.musicResponsiveListItemRenderer?.thumbnail
                  ?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                i.musicTwoRowItemRenderer?.thumbnailRenderer
                  ?.musicThumbnailRenderer?.thumbnail?.thumbnails;
              const thumbnail = extractThumbFromList(thumbList || []);
              if (
                pid &&
                title &&
                (pid.startsWith('PL') ||
                  pid.startsWith('OLAK') ||
                  pid.startsWith('RDCLAK'))
              ) {
                chartPlaylists.push({
                  id: pid,
                  title,
                  artist: 'YouTube Music',
                  duration: 'Playlist',
                  url: `https://music.youtube.com/playlist?list=${pid}`,
                  thumbnail,
                  isPlaylist: true,
                  subType: 'playlist',
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Charts parse error:', e);
    }

    let newAlbumsAndSingles: any[] = [];
    let liveTrendingTracks: any[] = [];
    let liveMusicVideos: any[] = [];
    const moodPlaylists: any[] = [];

    if (musicExploreRes?.sections) {
      for (const sec of musicExploreRes.sections) {
        const secTitle = (
          sec.header?.title?.text ||
          sec.title?.text ||
          ''
        ).toLowerCase();
        if (
          secTitle.includes('new albums') ||
          secTitle.includes('álbumes') ||
          secTitle.includes('novedades')
        ) {
          newAlbumsAndSingles = (sec.contents || [])
            .map(parseInnertubeItem)
            .filter(Boolean);
        } else if (
          secTitle.includes('trending') ||
          secTitle.includes('tendencias')
        ) {
          liveTrendingTracks = (sec.contents || [])
            .map(parseInnertubeItem)
            .filter(Boolean);
        } else if (
          secTitle.includes('music videos') ||
          secTitle.includes('vídeos') ||
          secTitle.includes('videos')
        ) {
          liveMusicVideos = (sec.contents || [])
            .map(parseInnertubeItem)
            .filter(Boolean);
        } else if (
          secTitle.includes('moods') ||
          secTitle.includes('géneros') ||
          secTitle.includes('estados')
        ) {
          const navButtons = (sec.contents || [])
            .filter((m: any) => m.endpoint?.payload?.params)
            .slice(0, 2);
          try {
            const catResponses = await withTimeout(
              Promise.all(
                navButtons.map((btn: any) =>
                  ytCountry.actions
                    .execute('/browse', {
                      browseId: 'FEmusic_moods_and_genres_category',
                      client: 'YTMUSIC',
                      params: btn.endpoint.payload.params,
                    })
                    .catch(() => null)
                )
              ),
              3000,
              [] as any[]
            );
            for (const catRes of catResponses) {
              const shelves =
                catRes?.data?.contents?.singleColumnBrowseResultsRenderer
                  ?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
                  ?.contents || [];
              for (const sh of shelves.slice(0, 2)) {
                const shelfItems = sh.musicCarouselShelfRenderer?.contents || [];
                for (const item of shelfItems) {
                  const renderer = item.musicTwoRowItemRenderer;
                  if (!renderer) continue;
                  const title = renderer.title?.runs?.[0]?.text;
                  let pid =
                    renderer.navigationEndpoint?.browseEndpoint?.browseId || '';
                  if (pid.startsWith('VL')) pid = pid.replace(/^VL/, '');
                  const thumb = extractThumbFromList(
                    renderer.thumbnailRenderer?.musicThumbnailRenderer
                      ?.thumbnail?.thumbnails || []
                  );
                  const subtitle =
                    renderer.subtitle?.runs?.map((r: any) => r.text).join('') ||
                    'YouTube Music';
                  if (pid && title) {
                    moodPlaylists.push({
                      id: pid,
                      title,
                      artist: subtitle.split('•')[0].trim() || 'YouTube Music',
                      duration: 'Playlist',
                      url: `https://music.youtube.com/playlist?list=${pid}`,
                      thumbnail: thumb,
                      isPlaylist: true,
                      subType: 'playlist',
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Moods fetch error:', e);
          }
        }
      }
    }

    const extractMusicSearchPlaylists = (searchRes: any) => {
      const raw =
        searchRes?.contents?.[0]?.contents || searchRes?.results || [];
      return raw.map(parseInnertubeItem).filter((p: any) => p && p.isPlaylist);
    };

    const topHitsList = extractMusicSearchPlaylists(topHitsSearchRes);
    const viralList = extractMusicSearchPlaylists(viralSearchRes);
    const popList = extractMusicSearchPlaylists(popSearchRes);

    const mixParaTi = dedupeItems([...moodPlaylists, ...chartPlaylists], 20);
    const top100 = dedupeItems([...chartPlaylists, ...topHitsList], 20);
    const top20Tendencias = dedupeItems(
      [...viralList, ...topHitsList.slice(5)],
      20
    );
    const dailyTopPlaylists = dedupeItems(
      newAlbumsAndSingles.length > 0 ? newAlbumsAndSingles : topHitsList,
      24
    );
    const dailyTop = dedupeItems(
      liveMusicVideos.length > 0 ? liveMusicVideos : liveTrendingTracks,
      24
    );
    const trending = dedupeItems(
      liveTrendingTracks.length > 0
        ? liveTrendingTracks
        : [...chartPlaylists, ...newAlbumsAndSingles],
      20
    );
    const pop = dedupeItems(
      [
        ...popList,
        ...moodPlaylists.filter(
          (m) =>
            m.title.toLowerCase().includes('pop') ||
            m.title.toLowerCase().includes('hits')
        ),
      ],
      20
    );

    const hasAnyContent =
      top100.length > 0 ||
      trending.length > 0 ||
      dailyTop.length > 0 ||
      dailyTopPlaylists.length > 0;

    if (!hasAnyContent) {
      throw new Error('Empty live YouTube Music response');
    }

    const data = {
      mixParaTi: mixParaTi.length > 0 ? mixParaTi : top100,
      top100,
      top20Tendencias: top20Tendencias.length > 0 ? top20Tendencias : top100,
      dailyTopPlaylists:
        dailyTopPlaylists.length > 0 ? dailyTopPlaylists : top100,
      dailyTop: dailyTop.length > 0 ? dailyTop : trending,
      trending: trending.length > 0 ? trending : top100,
      pop: pop.length > 0 ? pop : moodPlaylists,
    };

    exploreCache.set(country, { data, timestamp: Date.now() });
    return res.json(data);
  } catch (error) {
    console.warn(
      'Explore failed on Vercel, attempting Piped fallback...',
      error
    );

    try {
      for (const instance of PIPED_INSTANCES) {
        try {
          const pRes = await fetch(
            `${instance}/trending?region=${country === 'GLOBAL' ? 'US' : country}`,
            { signal: AbortSignal.timeout(2500) }
          );
          if (pRes.ok) {
            const pData = (await pRes.json()) as any;
            const trends: any[] = [];
            (pData || []).forEach((item: any) => {
              if (item.type === 'stream') {
                const vid = item.url.replace('/watch?v=', '');
                trends.push({
                  id: vid,
                  title: item.title,
                  artist: item.uploaderName || 'YouTube Music',
                  duration:
                    item.duration > 0
                      ? `${Math.floor(item.duration / 60)}:${String(
                          item.duration % 60
                        ).padStart(2, '0')}`
                      : 'N/A',
                  url: `https://www.youtube.com${item.url}`,
                  thumbnail:
                    item.thumbnail ||
                    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                  isPlaylist: false,
                  subType: item.title?.toLowerCase().includes('mix')
                    ? 'mix'
                    : 'cancion',
                });
              }
            });

            if (trends.length > 0) {
              const fallbackData = {
                trending: trends.slice(0, 10),
                dailyTop: trends.slice(10, 20),
                top100: trends.slice(20, 30),
                top20Tendencias: trends.slice(30, 40),
                dailyTopPlaylists: trends.slice(40, 50),
                mixParaTi: trends.slice(0, 10),
                pop: trends.slice(20, 30),
              };
              exploreCache.set(country, {
                data: fallbackData,
                timestamp: Date.now(),
              });
              return res.json(fallbackData);
            }
          }
        } catch {
          // try next Piped instance
        }
      }
    } catch (fallbackErr) {
      console.error('Explore Piped fallback failed:', fallbackErr);
    }

    return res
      .status(500)
      .json({ error: 'Internal error (and fallbacks failed)' });
  }
}