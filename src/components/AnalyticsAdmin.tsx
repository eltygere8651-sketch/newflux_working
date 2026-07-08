import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Users, Clock, Play, Search, Radio, Compass, MessageSquare, Trash2, Calendar } from 'lucide-react';

export default function AnalyticsAdmin() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const todayData = dailyData[dailyData.length - 1] || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-400" />
          Analytics Dashboard
        </h1>
        <button onClick={fetchAnalytics} className="bg-surface hover:bg-surface-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users />} label="Active Users (Today)" value={todayData.activeUsers || 0} />
        <StatCard icon={<Clock />} label="Usage Time (Mins)" value={todayData.usageTime || 0} />
        <StatCard icon={<Calendar />} label="App Opens" value={todayData.appOpens || 0} />
        <StatCard icon={<Search />} label="Searches" value={todayData.searches || 0} />
        <StatCard icon={<Radio />} label="Sofia DJ Uses" value={todayData.sofiaDjUses || 0} />
        <StatCard icon={<Compass />} label="Explorer Uses" value={todayData.explorerUses || 0} />
        <StatCard icon={<MessageSquare />} label="Community Uses" value={todayData.communityUses || 0} />
        <StatCard icon={<Trash2 />} label="Deleted Playlists" value={todayData.deletedPlaylists || 0} />
      </div>

      <div className="bg-surface rounded-xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold text-white mb-6">Engagement Trends (Last 7 Days)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="appOpens" name="App Opens" fill="#facc15" radius={[4, 4, 0, 0]} />
              <Bar dataKey="usageTime" name="Usage Time (min)" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" /> Top Songs
          </h2>
          <div className="space-y-3">
            {topSongs.length === 0 ? (
              <p className="text-gray-400 text-sm">No song data yet</p>
            ) : (
              topSongs.map((song, i) => (
                <div key={song.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-gray-500 font-mono text-sm w-4">{i + 1}</span>
                    <div className="truncate">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                    </div>
                  </div>
                  <span className="text-purple-400 font-mono text-sm px-2 py-1 bg-purple-500/10 rounded ml-4 whitespace-nowrap">
                    {song.count} plays
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" /> Top Playlists
          </h2>
          <div className="space-y-3">
            {topPlaylists.length === 0 ? (
              <p className="text-gray-400 text-sm">No playlist data yet</p>
            ) : (
              topPlaylists.map((pl, i) => (
                <div key={pl.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-gray-500 font-mono text-sm w-4">{i + 1}</span>
                    <p className="text-white font-medium truncate">{pl.title}</p>
                  </div>
                  <span className="text-purple-400 font-mono text-sm px-2 py-1 bg-purple-500/10 rounded ml-4 whitespace-nowrap">
                    {pl.count} plays
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-white/5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg text-purple-400">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{label}</h3>
        <p className="text-3xl font-bold text-white font-mono">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
