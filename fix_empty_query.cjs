const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

const oldCode = `      let query = currentTrack.title.replace(/karaoke|instrumental|cover|lyrics|letra|video oficial|official video/gi, '').trim();
      query = query.replace(/\\[.*?\\]|\\(.*?\\)/g, '').trim();
      
      fetch(\`/api/lyrics/search?q=\${encodeURIComponent(query)}\`)`;

const newCode = `      let query = currentTrack.title.replace(/karaoke|instrumental|cover|lyrics|letra|video oficial|official video/gi, '').trim();
      query = query.replace(/\\[.*?\\]|\\(.*?\\)/g, '').trim();
      
      if (!query) {
        setLyricsState("not_found");
        return;
      }
      
      fetch(\`/api/lyrics/search?q=\${encodeURIComponent(query)}\`)`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Empty query check added");
