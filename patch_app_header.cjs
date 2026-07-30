const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Center logo logic
content = content.replace(
  '<div className="w-full mb-1 sm:mb-3 px-3 sm:px-6 flex items-center justify-between">',
  '<div className="w-full mb-1 sm:mb-3 px-4 sm:px-6 flex items-center justify-between relative min-h-[44px]">'
);

content = content.replace(
  '          <div className="flex items-center gap-2">',
  '          <div className="flex-1 flex items-center justify-start">'
);

content = content.replace(
  '          <div className="flex flex-col items-center justify-center shrink-0">',
  '          <div className="shrink-0 flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">'
);

content = content.replace(
  '          <div className="flex flex-col items-end justify-center relative">',
  '          <div className="flex-1 flex flex-col items-end justify-center relative">'
);

// Menu button refinements (Make it circular on mobile, keep pill on desktop)
content = content.replace(
  '                className="relative flex items-center justify-center p-1.5 sm:p-2 pr-3.5 sm:pr-4 rounded-full border border-white/10 text-white bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 active:scale-90 cursor-pointer gap-2 group shadow-[0_2px_10px_rgba(0,0,0,0.4)]"',
  '                className="relative flex items-center justify-center p-1.5 sm:p-2 sm:pr-4 rounded-full border border-white/10 text-white bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 active:scale-90 cursor-pointer sm:gap-2 group shadow-[0_2px_10px_rgba(0,0,0,0.4)] aspect-square sm:aspect-auto"'
);

// Hide the word "Menú" on mobile to avoid redundancy, keep on desktop
content = content.replace(
  '                <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-emerald-300 transition-colors relative">',
  '                <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-emerald-300 transition-colors relative">'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_app_header.cjs');
