const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

const oldFetch = `fetch(\`/api/lyrics/search?q=\${encodeURIComponent(query)}\`)
        .then(res => res.json())`;
const newFetch = `fetch(\`/api/lyrics/search?q=\${encodeURIComponent(query)}\`)
        .then(res => {
          if (!res.ok) throw new Error(\`Server returned \${res.status}\`);
          return res.json();
        })`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Frontend fetch error handling improved");
