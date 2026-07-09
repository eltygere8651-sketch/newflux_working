const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const target = `<span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm relative z-10">
              Ajustes FLX
            </span>`;

const replacement = `<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm relative z-10">
              Ajustes
            </span>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/FAIView.tsx', code);
    console.log("Updated FAIView.tsx Settings button via exact match successfully.");
} else {
    const target2 = /<span className="text-\[10px\] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm relative z-10">[\s\S]*?Ajustes FLX[\s\S]*?<\/span>/;
    if (target2.test(code)) {
        code = code.replace(target2, replacement);
        fs.writeFileSync('src/components/FAIView.tsx', code);
        console.log("Updated FAIView.tsx Settings button via Regex successfully.");
    } else {
        console.log("Regex failed too.");
    }
}
