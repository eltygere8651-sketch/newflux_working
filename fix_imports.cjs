const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// First remove 'Bot, ' from all imports
code = code.replace(/Bot,\s*/g, '');
code = code.replace(/,\s*Bot/g, '');

// Then carefully add 'Bot, ' to the lucide-react import
code = code.replace(/import \{(.*?)\} from "lucide-react";/, (match, p1) => {
    return 'import {' + p1 + ', Bot} from "lucide-react";';
});

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
