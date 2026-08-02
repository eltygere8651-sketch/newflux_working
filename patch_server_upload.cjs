const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const importMulter = `import multer from "multer";\n`;
content = content.replace(`import fs from "fs";`, `import fs from "fs";\n${importMulter}`);

const uploadEndpoint = `
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "public");
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});
const upload = multer({ storage: storage });

app.post("/api/admin/upload-audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  return res.json({ success: true, filename: req.file.filename, url: \`/\${req.file.filename}\` });
});

`;

content = content.replace(`app.post("/api/admin/notify-featured-topic"`, uploadEndpoint + `app.post("/api/admin/notify-featured-topic"`);

fs.writeFileSync('server.ts', content);
