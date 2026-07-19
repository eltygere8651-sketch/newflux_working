const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');
code = code.replace("localStorage.removeItem('flux_vip_device_id');", "localStorage.setItem('flux_voluntary_logout', 'true');");
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
