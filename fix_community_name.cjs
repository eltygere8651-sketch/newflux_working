const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(
  'Publicada por:{" "}',
  '<span className="hidden sm:inline">Publicada por: </span><span className="sm:hidden">Por: </span>'
);

code = code.replace(
  '<p className="text-[9.5px] text-slate-400 font-semibold tracking-wide truncate mt-1">',
  '<p className="text-[9.5px] text-slate-400 font-semibold tracking-wide mt-1 line-clamp-2 leading-tight">'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Fixed GymMusicPlayer.tsx for mobile creator names");
