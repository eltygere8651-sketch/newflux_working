const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
const routes = code.split('app.get("/api/youtube/upnext", async (req, res) => {');

if (routes.length === 3) {
  // We have 2 occurrences, which means split gives 3 parts.
  // We keep the first part (before the first occurrence), and the last part (the second occurrence and onwards).
  code = routes[0] + 'app.get("/api/youtube/upnext", async (req, res) => {' + routes[2];
  fs.writeFileSync('server.ts', code);
  console.log("Removed duplicated route");
} else {
  console.log("Not exactly two occurrences found", routes.length);
}
