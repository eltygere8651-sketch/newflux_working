const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
app.get("/api/youtube/upnext", async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  if (!yt) {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    const upNext = await yt.music.getUpNext(videoId);
    if (!upNext || !upNext.contents) {
      return res.json([]);
    }
    
    const items = upNext.contents.filter((c: any) => c.video_id).map((c: any) => {
       let durationStr = c.duration?.text || "";
       if (!durationStr && c.duration?.seconds) {
          const min = Math.floor(c.duration.seconds / 60);
          const sec = c.duration.seconds % 60;
          durationStr = \`\${min}:\${sec.toString().padStart(2, '0')}\`;
       }
       
       let thumbnail = "";
       if (c.thumbnail && c.thumbnail.length > 0) {
          thumbnail = c.thumbnail[c.thumbnail.length - 1].url;
       }

       return {
          id: 'yt_temp_' + c.video_id,
          title: c.title?.text || "",
          artist: c.author || c.artists?.map((a: any) => a.name).join(", ") || "",
          duration: durationStr,
          thumbnail: thumbnail,
          url: \`https://www.youtube.com/watch?v=\${c.video_id}\`,
          isPlaylist: false,
          subType: "cancion",
          bpm: 120
       };
    });

    res.json(items);
  } catch (error) {
    console.error("UpNext error:", error);
    res.status(500).json({ error: "Failed to fetch up next" });
  }
});
`;

code = code.replace('app.get("/api/youtube/video-info"', routeCode + '\napp.get("/api/youtube/video-info"');
fs.writeFileSync('server.ts', code);
