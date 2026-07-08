let localEvents: Record<string, number> = {
  appOpens: 0,
  logins: 0,
  logouts: 0,
  usageTime: 0,
  searches: 0,
  sofiaDjUses: 0,
  explorerUses: 0,
  communityUses: 0,
  deletedPlaylists: 0,
};

let localSongs: Record<string, { title: string; artist?: string; count: number }> = {};
let localPlaylists: Record<string, { title: string; count: number }> = {};

let lastSyncTime = Date.now();
let userId = 'anonymous';
let isInitialized = false;

export const initAnalytics = (uid: string | null) => {
  if (uid) userId = uid;
  if (!isInitialized) {
    isInitialized = true;
    localEvents.appOpens += 1;
    
    // Setup interval for usage time (only when visible)
    let lastTick = Date.now();
    setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        localEvents.usageTime += Math.floor((now - lastTick) / 1000);
      }
      lastTick = now;
      
      // Auto sync every 3 minutes
      if (now - lastSyncTime > 3 * 60 * 1000) {
        syncAnalytics();
      }
    }, 5000);

    // Sync on exit
    window.addEventListener('beforeunload', () => {
      syncAnalytics(true);
    });
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        syncAnalytics(true);
      }
    });
  }
};

export const trackLogin = (uid: string) => {
  userId = uid;
  localEvents.logins += 1;
  syncAnalytics();
};

export const trackLogout = () => {
  localEvents.logouts += 1;
  syncAnalytics();
  userId = 'anonymous';
};

export const trackSearch = () => {
  localEvents.searches += 1;
};

export const trackSofiaDj = () => {
  localEvents.sofiaDjUses += 1;
};

export const trackExplorer = () => {
  localEvents.explorerUses += 1;
};

export const trackCommunity = () => {
  localEvents.communityUses += 1;
};

export const trackPlaylistDelete = () => {
  localEvents.deletedPlaylists += 1;
};

export const trackSongPlayed = (id: string, title: string, artist?: string) => {
  if (!localSongs[id]) {
    localSongs[id] = { title, artist, count: 0 };
  }
  localSongs[id].count += 1;
};

export const trackPlaylistPlayed = (id: string, title: string) => {
  if (!localPlaylists[id]) {
    localPlaylists[id] = { title, count: 0 };
  }
  localPlaylists[id].count += 1;
};

export const syncAnalytics = async (isBeacon = false) => {
  const eventsToSync = { ...localEvents };
  const songsToSync = { ...localSongs };
  const playlistsToSync = { ...localPlaylists };
  
  // Check if anything to sync
  const hasEvents = Object.values(eventsToSync).some(v => v > 0);
  const hasSongs = Object.keys(songsToSync).length > 0;
  const hasPlaylists = Object.keys(playlistsToSync).length > 0;
  
  if (!hasEvents && !hasSongs && !hasPlaylists) return;
  
  // Reset local
  for (const key of Object.keys(localEvents)) {
    localEvents[key] = 0;
  }
  localSongs = {};
  localPlaylists = {};
  lastSyncTime = Date.now();
  
  const payload = JSON.stringify({
    userId,
    events: eventsToSync,
    songs: songsToSync,
    playlists: playlistsToSync
  });
  
  if (isBeacon) {
    fetch('/api/analytics/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  } else {
    try {
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    } catch (e) {
      console.warn("Failed to sync analytics, will retry later");
      // Restore on failure
      for (const [k, v] of Object.entries(eventsToSync)) {
        localEvents[k] += v;
      }
      for (const [k, v] of Object.entries(songsToSync)) {
        if (!localSongs[k]) localSongs[k] = v;
        else localSongs[k].count += v.count;
      }
      for (const [k, v] of Object.entries(playlistsToSync)) {
        if (!localPlaylists[k]) localPlaylists[k] = v;
        else localPlaylists[k].count += v.count;
      }
    }
  }
};
