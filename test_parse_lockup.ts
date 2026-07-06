import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Top 100 Canciones España", { type: "playlist" });
  const playlists = res.playlists || res.results || [];
  
  playlists.forEach((p:any) => {
    let author = "";
    if (p.type === "LockupView") {
       author = p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text || "";
       if (!author && p.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.runs?.[0]?.text) {
          author = p.metadata.metadata.metadata_rows[0].metadata_parts[0].text.runs[0].text;
       }
    } else {
       if (Array.isArray(p.artists) && p.artists.length > 0) {
         author = p.artists.map((a: any) => a.name).join(", ");
       } else if (p.author) {
         author = typeof p.author === "string" ? p.author : p.author.name || "";
       }
    }
    
    let title = "";
    if (p.type === "LockupView") {
       title = p.metadata?.title?.text || "";
    } else {
       title = p.title?.text || p.title || "";
    }
    
    if (author.includes("YouTube")) {
       console.log("Found OFFICIAL:", title, author, p.content_id || p.id);
    } else {
       //console.log("Other:", title, author);
    }
  });
}
test();
