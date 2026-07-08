const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace('import {\\n  Globe,', 'import {');
code = code.replace('from "lucide-react";', '  Globe,\\n} from "lucide-react";');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
