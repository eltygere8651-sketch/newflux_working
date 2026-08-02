const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const audioListEndpoint = `
app.get("/api/admin/system-audio", (req, res) => {
  try {
    const dir = path.join(process.cwd(), "public");
    if (!fs.existsSync(dir)){
        return res.json({ files: [] });
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
    res.json({ files: files.map(f => ({ name: f, url: \`/\${f}\`, size: fs.statSync(path.join(dir, f)).size })) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/system-audio/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    // Basic security check to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filepath = path.join(process.cwd(), "public", filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});
`;

content = content.replace(`app.post("/api/admin/notify-featured-topic"`, audioListEndpoint + `\napp.post("/api/admin/notify-featured-topic"`);

fs.writeFileSync('server.ts', content);
