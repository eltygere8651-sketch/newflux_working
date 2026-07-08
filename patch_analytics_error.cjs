const fs = require('fs');
let code = fs.readFileSync('src/components/AnalyticsAdmin.tsx', 'utf8');

code = code.replace(
  /const fetchAnalytics = async \(\) => \{[\s\S]*?\} finally \{/m,
  `const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      try {
        const dailyQuery = query(collection(db, "analytics_daily"), orderBy("__name__", "desc"), limit(7));
        const dailySnap = await getDocs(dailyQuery);
        const daily = dailySnap.docs.map(doc => ({
          date: doc.id,
          appOpens: doc.data().appOpens || 0,
          usageTime: Math.floor((doc.data().usageTime || 0) / 60),
          activeUsers: doc.data().activeUsers?.length || 0,
          searches: doc.data().searches || 0,
          sofiaDjUses: doc.data().sofiaDjUses || 0,
          explorerUses: doc.data().explorerUses || 0,
          communityUses: doc.data().communityUses || 0,
          deletedPlaylists: doc.data().deletedPlaylists || 0
        })).reverse();
        setDailyData(daily);
      } catch (e: any) {
        console.error("Error fetching daily stats:", e.message || e);
      }

      try {
        const songsQuery = query(collection(db, "analytics_songs"), orderBy("count", "desc"), limit(10));
        const songsSnap = await getDocs(songsQuery);
        setTopSongs(songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e: any) {
        console.error("Error fetching top songs:", e.message || e);
      }

      try {
        const plQuery = query(collection(db, "analytics_playlists"), orderBy("count", "desc"), limit(10));
        const plSnap = await getDocs(plQuery);
        setTopPlaylists(plSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e: any) {
        console.error("Error fetching top playlists:", e.message || e);
      }

    } catch (e: any) {
      console.error("Error fetching analytics", e.message || e);
    } finally {`
);

fs.writeFileSync('src/components/AnalyticsAdmin.tsx', code);
