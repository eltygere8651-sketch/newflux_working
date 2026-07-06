import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Pop Playlist Official", { type: "playlist" });
  
  const parseInnertubeItem = (p: any): any => {
    try {
      if (!p) return null;
      let id =
        p.content_id ||
        p.id?.toString() ||
        p.endpoint?.payload?.videoId ||
        p.endpoint?.payload?.browseId ||
        p.playlist_id?.toString() ||
        "";
      if (p.type === "Playlist") id = p.id || p.playlist_id || "";
      if (!id) return null;

      let title =
        p.metadata?.title?.text ||
        p.title?.text ||
        p.title?.toString() ||
        p.name ||
        "";

      if (!title && typeof p.title === "string") title = p.title;
      if (!title && p.title && typeof p.title === "object" && p.title.text)
        title = p.title.text;
      if (!title && p.flex_columns && p.flex_columns.length > 0) {
        title = p.flex_columns[0].title?.text || p.flex_columns[0].title?.toString() || "";
      }

      if (!title) return null;

      let author = "";
      if (Array.isArray(p.artists) && p.artists.length > 0) {
        author = p.artists.map((a: any) => a.name).join(", ");
      } else if (p.author) {
        author = typeof p.author === "string" ? p.author : p.author.name || "";
      } else if (Array.isArray(p.subtitle?.runs)) {
        author = p.subtitle.runs.map((r: any) => r.text).join("");
      } else if (p.flex_columns && p.flex_columns.length > 1) {
        author = p.flex_columns[1].title?.text || p.flex_columns[1].title?.toString() || "";
      }

      return {
        id,
        title,
        artist: author || "YouTube Music",
      };
    } catch (e) {
      return null;
    }
  };

  const playlists = (res.playlists || res.results || []).map(parseInnertubeItem);
  console.log("Playlists:", playlists);
  
  const official = playlists.filter((p: any) => p?.artist.toLowerCase().includes("youtube"));
  console.log("Official Playlists:", official);
}
test();
