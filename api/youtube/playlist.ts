export const maxDuration = 60;
import { Innertube, UniversalCache } from 'youtubei.js';

let yt: Innertube | null = null;
const playlistCache = new Map<string, { data: any; timestamp: number }>();
const playlistInfoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

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

async function getYtClient(): Promise<Innertube | null> {
  if (yt) return yt;
  try {
    yt = await withTimeout(
      Innertube.create({ cache: new UniversalCache(false) }),
      4000,
      null as any
    );
    return yt;
  } catch (err) {
    console.error('Innertube init failed:', err);
    return null;
  }
}

const safeText = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val === '[object Object]' ? '' : val;
  if (typeof val.text === 'string') return val.text;
  if (Array.isArray(val.runs)) return val.runs.map((r: any) => r.text || '').join('');
  if (typeof val.toString === 'function') {
    const s = val.toString();
    return s === '[object Object]' ? '' : s;
  }
  return '';
};

async function fetchLivePlaylistInfo(playlistId: string, forceRefresh = false) {
  const cleanId = playlistId.replace(/^VL/, '');
  const cached = playlistInfoCache.get(cleanId);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const client = await getYtClient();
  if (client) {
    try {
      let title = '';
      let thumbnail = '';
      let artist = '';
      let trackCount = 0;
      let description = '';

      if (cleanId.startsWith('MPRE')) {
        const album: any = await withTimeout(
          client.music.getAlbum(cleanId),
          3500,
          null
        );
        if (album && album.header) {
          const head = album.header as any;
          title = safeText(head.title) || 'Álbum Recomendado';
          artist =
            safeText(head.author?.name || head.author || head.artist?.name) ||
            'YouTube Music';
          const thumbs = head.thumbnails || head.thumbnail?.contents || [];
          thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || '';
          trackCount = Number(
            head.song_count ||
              head.item_count ||
              head.tracks_count ||
              album.contents?.length ||
              0
          );
          description =
            safeText(head.description) || safeText(head.second_subtitle);
        }
      } else if (cleanId.startsWith('RDCLAK') || cleanId.startsWith('OLAK')) {
        let fetched = false;
        try {
          const mPlaylist: any = await withTimeout(
            client.music.getPlaylist(cleanId),
            3500,
            null
          );
          if (mPlaylist) {
            fetched = true;
            const head = (mPlaylist.header || {}) as any;
            title = safeText(head.title) || 'Lista Recomendada';
            artist =
              safeText(
                head.author?.name || head.author || head.strapline_text_one
              ) || 'YouTube Music';
            const thumbs = head.thumbnail?.contents || head.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || '';
            const mItems = mPlaylist.items || mPlaylist.contents || [];
            trackCount = Number(
              head.song_count ||
                head.item_count ||
                head.tracks_count ||
                mItems.length ||
                0
            );
            description =
              safeText(head.description) || safeText(head.second_subtitle);
            if (!thumbnail && mItems.length > 0) {
              const firstVid =
                mItems[0]?.id ||
                mItems[0]?.video_id ||
                mItems[0]?.endpoint?.payload?.videoId;
              if (firstVid) {
                thumbnail = `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg`;
              }
            }
          }
        } catch {
          // fallback below
        }

        if (!fetched) {
          const playlist: any = await withTimeout(
            client.getPlaylist(cleanId),
            3500,
            null
          );
          if (playlist && playlist.info) {
            const info = playlist.info as any;
            title = safeText(info.title) || 'Lista Recomendada';
            artist =
              safeText(info.author?.name || info.author) || 'YouTube Music';
            const thumbs = info.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || '';
            trackCount = Number(
              info.total_items ||
                info.video_count ||
                playlist.items?.length ||
                0
            );
            description = safeText(info.description);
          }
        }
      } else {
        let fetched = false;
        try {
          const playlist: any = await withTimeout(
            client.getPlaylist(cleanId),
            3500,
            null
          );
          if (playlist && playlist.info) {
            fetched = true;
            const info = playlist.info as any;
            title = safeText(info.title) || 'Lista Recomendada';
            artist =
              safeText(info.author?.name || info.author) || 'YouTube Music';
            const thumbs = info.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || '';
            trackCount = Number(
              info.total_items ||
                info.video_count ||
                playlist.items?.length ||
                0
            );
            description = safeText(info.description);
          }
        } catch {
          // fallback below
        }

        if (!fetched) {
          const mPlaylist: any = await withTimeout(
            client.music.getPlaylist(cleanId),
            3500,
            null
          );
          if (mPlaylist && mPlaylist.header) {
            const head = mPlaylist.header as any;
            title = safeText(head.title) || 'Lista Recomendada';
            artist =
              safeText(
                head.author?.name || head.author || head.strapline_text_one
              ) || 'YouTube Music';
            const thumbs = head.thumbnail?.contents || head.thumbnails || [];
            thumbnail = thumbs[0]?.url || thumbs[thumbs.length - 1]?.url || '';
            const mItems = mPlaylist.items || mPlaylist.contents || [];
            trackCount = Number(
              head.song_count ||
                head.item_count ||
                head.tracks_count ||
                mItems.length ||
                0
            );
            description =
              safeText(head.description) || safeText(head.second_subtitle);
          }
        }
      }

      thumbnail = upgradeYtThumb(thumbnail);
      const cleanArtist =
        artist && artist !== 'N/A' ? artist : 'YouTube Music';

      if (title || thumbnail) {
        const info = {
          id: cleanId,
          title: title || 'Lista Recomendada',
          thumbnail,
          artist: cleanArtist,
          trackCount,
          description:
            description ||
            (trackCount
              ? `${trackCount} canciones`
              : 'Playlist oficial de YouTube Music'),
        };
        playlistInfoCache.set(cleanId, { data: info, timestamp: Date.now() });
        return info;
      }
    } catch (err) {
      console.warn(`Innertube playlist info failed for ${cleanId}:`, err);
    }
  }

  for (const instance of PIPED_INSTANCES) {
    try {
      const pRes = await fetch(`${instance}/playlists/${cleanId}`, {
        signal: AbortSignal.timeout(2500),
      });
      if (pRes.ok) {
        const pData = (await pRes.json()) as any;
        let thumb = pData.thumbnailUrl || '';
        if (
          !thumb &&
          pData.relatedStreams &&
          pData.relatedStreams.length > 0
        ) {
          const firstVid = pData.relatedStreams[0].url.replace('/watch?v=', '');
          thumb = `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg`;
        }
        thumb = upgradeYtThumb(thumb);
        const tCount = pData.relatedStreams?.length || pData.videos || 0;
        const info = {
          id: cleanId,
          title: pData.name || 'Lista Recomendada',
          thumbnail: thumb,
          artist: pData.uploader || pData.uploaderName || 'YouTube Music',
          trackCount: tCount,
          description:
            pData.description ||
            (tCount ? `${tCount} canciones` : 'Playlist de YouTube Music'),
        };
        playlistInfoCache.set(cleanId, { data: info, timestamp: Date.now() });
        return info;
      }
    } catch {
      // try next instance
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query?.action as string) || '';
  const urlPath = typeof req.url === 'string' ? req.url : '';
  const isSyncAction =
    action === 'sync' ||
    req.method === 'POST' ||
    urlPath.includes('sync-explore-playlists');
  const isInfoAction =
    action === 'info' || urlPath.includes('playlist-info');

  // --- SYNC EXPLORE CUSTOM PLAYLISTS (POST /api/youtube/sync-explore-playlists -> ?action=sync) ---
  if (isSyncAction) {
    res.setHeader('Cache-Control', 'no-store');
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      const items = Array.isArray(body?.items) ? body.items : [];
      if (items.length === 0) return res.json([]);

      const results: any[] = [...items];
      const BATCH_SIZE = 6;
      const startTime = Date.now();
      const HARD_DEADLINE_MS = 6500; // Guard against Vercel timeout

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        if (Date.now() - startTime > HARD_DEADLINE_MS) {
          break;
        }
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item: any, idx: number) => {
            const targetIdx = i + idx;
            if (!item || !item.id || item.isPlaylist === false) {
              return;
            }
            const isYtPlaylist =
              item.id.startsWith('RDCLAK') ||
              item.id.startsWith('OLAK') ||
              item.id.startsWith('PL') ||
              item.id.startsWith('MPRE') ||
              item.id.startsWith('VL');
            if (!isYtPlaylist) {
              return;
            }

            try {
              const liveInfo = await fetchLivePlaylistInfo(item.id);
              if (!liveInfo) return;
              const existingThumb = item.thumbnail || '';
              const isBrokenOrExpiringThumb =
                !existingThumb || existingThumb.includes('i9.ytimg.com/s_p/');
              results[targetIdx] = {
                ...item,
                title: liveInfo.title || item.title,
                artist: liveInfo.artist || item.artist,
                trackCount:
                  liveInfo.trackCount > 0
                    ? liveInfo.trackCount
                    : item.trackCount,
                description: liveInfo.description || item.description,
                thumbnail: isBrokenOrExpiringThumb
                  ? liveInfo.thumbnail || existingThumb
                  : existingThumb,
              };
            } catch {
              // keep original item
            }
          })
        );
      }

      return res.json(results);
    } catch (err) {
      console.error('Sync explore playlists error:', err);
      return res.status(500).json({ error: 'Failed to sync explore playlists' });
    }
  }

  const rawId = (req.query?.id as string) || '';
  const id = rawId.replace(/^VL/, '');
  if (!id) return res.status(400).json({ error: 'Missing playlist id' });

  const forceRefresh = req.query?.refresh === '1';

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

  // --- PLAYLIST INFO (GET /api/youtube/playlist-info -> ?action=info) ---
  if (isInfoAction) {
    try {
      const info = await fetchLivePlaylistInfo(id, forceRefresh);
      if (info) return res.json(info);

      return res.json({
        id,
        title: 'Lista Personalizada',
        thumbnail:
          id.length === 11
            ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
            : '',
        artist: 'YouTube Music',
        trackCount: 0,
        description: 'Playlist de YouTube Music',
      });
    } catch (err) {
      console.error('Playlist info fetch error:', err);
      return res.json({
        id,
        title: 'Lista Personalizada',
        thumbnail: '',
        artist: 'YouTube Music',
        trackCount: 0,
        description: 'Playlist de YouTube Music',
      });
    }
  }

  // --- PLAYLIST TRACKS (GET /api/youtube/playlist?id=...) ---
  const cached = playlistCache.get(id);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  const client = await getYtClient();
  if (!client) {
    return res.status(503).json({ error: 'Service unavailable' });
  }

  try {
    let playlist: any;
    let rawVideos: any[] = [];

    if (id.startsWith('MPRE')) {
      playlist = await withTimeout(client.music.getAlbum(id), 5000, null);
      if (playlist?.contents) {
        rawVideos = Array.isArray(playlist.contents) ? playlist.contents : [];
      }
    } else if (id.startsWith('RDCLAK') || id.startsWith('OLAK')) {
      try {
        const musicPlaylist: any = await withTimeout(
          client.music.getPlaylist(id),
          5000,
          null
        );
        if (musicPlaylist) {
          playlist = musicPlaylist;
          if (Array.isArray(musicPlaylist.items)) {
            rawVideos.push(...musicPlaylist.items);
          }
          if (Array.isArray(musicPlaylist.contents)) {
            musicPlaylist.contents.forEach((item: any) => {
              if (item && !rawVideos.includes(item)) rawVideos.push(item);
            });
          }
          if (musicPlaylist.content) {
            const pitems =
              musicPlaylist.content.items ||
              musicPlaylist.content.contents ||
              [];
            if (Array.isArray(pitems)) {
              pitems.forEach((item: any) => {
                if (item && !rawVideos.includes(item)) rawVideos.push(item);
              });
            }
          }
        }
      } catch {
        // fallback below
      }

      if (rawVideos.length === 0) {
        try {
          playlist = await withTimeout(client.getPlaylist(id), 4500, null);
          if (Array.isArray(playlist?.items)) rawVideos.push(...playlist.items);
          if (Array.isArray(playlist?.videos)) rawVideos.push(...playlist.videos);
        } catch {
          // ignore
        }
      }
    } else {
      try {
        playlist = await withTimeout(client.getPlaylist(id), 5000, null);
        if (Array.isArray(playlist?.items)) {
          rawVideos.push(...playlist.items);
        }
        if (playlist?.videos) {
          if (Array.isArray(playlist.videos)) {
            rawVideos.push(...playlist.videos);
          } else {
            const innerContents =
              playlist.videos.contents || playlist.videos.entries || [];
            if (Array.isArray(innerContents)) {
              rawVideos.push(...innerContents);
            }
          }
        }
        if (Array.isArray(playlist?.contents)) {
          playlist.contents.forEach((item: any) => {
            if (item && !rawVideos.includes(item)) rawVideos.push(item);
          });
        }
      } catch {
        // fallback below
      }

      if (rawVideos.length === 0) {
        try {
          const musicPlaylist: any = await withTimeout(
            client.music.getPlaylist(id),
            4500,
            null
          );
          if (musicPlaylist) {
            playlist = musicPlaylist;
            if (Array.isArray(musicPlaylist.items)) {
              rawVideos.push(...musicPlaylist.items);
            }
            if (Array.isArray(musicPlaylist.contents)) {
              musicPlaylist.contents.forEach((item: any) => {
                if (item && !rawVideos.includes(item)) rawVideos.push(item);
              });
            }
            if (musicPlaylist.content) {
              const pitems =
                musicPlaylist.content.items ||
                musicPlaylist.content.contents ||
                [];
              if (Array.isArray(pitems)) {
                pitems.forEach((item: any) => {
                  if (item && !rawVideos.includes(item)) rawVideos.push(item);
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }

      if (rawVideos.length === 0) {
        try {
          const album: any = await withTimeout(
            client.music.getAlbum(id),
            4000,
            null
          );
          if (album && Array.isArray(album.contents)) {
            playlist = album;
            rawVideos.push(...album.contents);
          }
        } catch {
          // ignore
        }
      }
    }

    const titleFallback = req.query?.title as string;
    if (rawVideos.length === 0 && titleFallback) {
      const searchRes: any = await withTimeout(
        client.music.search(titleFallback, { type: 'song' }).catch(() => null),
        4000,
        null
      );
      if (searchRes?.contents?.length > 0) {
        const firstSection = searchRes.contents[0];
        if (firstSection?.contents) {
          rawVideos = firstSection.contents;
        } else if (searchRes.results) {
          rawVideos = searchRes.results;
        }
      }
    }

    const tracks = rawVideos
      .map((v: any) => {
        try {
          const title =
            v.title?.text || v.title?.toString() || v.name || 'Untitled Track';

          let artist = 'YouTube Music';
          if (Array.isArray(v.artists) && v.artists.length > 0) {
            artist = v.artists.map((a: any) => a.name).join(', ');
          } else if (Array.isArray(v.authors) && v.authors.length > 0) {
            artist = v.authors.map((a: any) => a.name).join(', ');
          } else if (v.author?.name || typeof v.author === 'string') {
            artist = v.author?.name || v.author?.toString();
          } else if (playlist?.author?.name) {
            artist = playlist.author.name;
          }

          const duration =
            v.duration?.text ||
            v.duration?.toString() ||
            v.length?.text ||
            v.length_text?.text ||
            'N/A';
          const trackId =
            v.id ||
            v.video_id ||
            v.videoId ||
            v.content_id ||
            v.endpoint?.payload?.videoId ||
            '';

          let thumbnail = '';
          if (Array.isArray(v.thumbnails) && v.thumbnails.length > 0) {
            thumbnail = v.thumbnails[0].url || '';
          } else if (
            Array.isArray(v.thumbnail?.thumbnails) &&
            v.thumbnail.thumbnails.length > 0
          ) {
            thumbnail = v.thumbnail.thumbnails[0].url || '';
          } else if (v.thumbnail_url) {
            thumbnail = v.thumbnail_url;
          }

          if (trackId && title) {
            return {
              id: trackId,
              title,
              artist,
              duration,
              url: `https://www.youtube.com/watch?v=${trackId}`,
              thumbnail:
                upgradeYtThumb(thumbnail) ||
                `https://i.ytimg.com/vi/${trackId}/mqdefault.jpg`,
            };
          }
        } catch {
          return null;
        }
        return null;
      })
      .filter(Boolean);

    if (tracks.length > 0) {
      playlistCache.set(id, { data: tracks, timestamp: Date.now() });
      return res.json(tracks);
    }

    // Piped API fallback if Innertube returned empty
    for (const instance of PIPED_INSTANCES) {
      try {
        const pRes = await fetch(`${instance}/playlists/${id}`, {
          signal: AbortSignal.timeout(2500),
        });
        if (pRes.ok) {
          const pData = (await pRes.json()) as any;
          const pipedTracks: any[] = [];
          (pData.relatedStreams || []).forEach((item: any) => {
            if (item.url) {
              const vid = item.url.replace('/watch?v=', '');
              pipedTracks.push({
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
                  item.thumbnail || `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
              });
            }
          });
          if (pipedTracks.length > 0) {
            playlistCache.set(id, { data: pipedTracks, timestamp: Date.now() });
            return res.json(pipedTracks);
          }
        }
      } catch {
        // try next Piped instance
      }
    }

    return res.json([]);
  } catch (error) {
    console.error('YouTube playlist error:', error);
    return res.status(500).json({ error: 'Internal YouTube playlist error' });
  }
}
