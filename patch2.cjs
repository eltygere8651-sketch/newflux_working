const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  'className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center sm:px-4"',
  'className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center"'
);

code = code.replace(
  'className="w-full h-[100dvh] sm:h-auto sm:max-w-md bg-gradient-to-b from-[#1e3280] to-[#0a1128] rounded-none sm:rounded-3xl pt-12 sm:pt-6 pb-8 px-5 sm:px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-5 sm:gap-6 sm:max-h-[85vh] overflow-hidden"',
  'className="w-full h-[100dvh] max-w-4xl bg-gradient-to-b from-[#0a1128] to-[#070b1a] rounded-none pt-16 sm:pt-12 pb-12 px-6 sm:px-12 flex flex-col gap-6 sm:gap-8 overflow-hidden relative shadow-2xl border-x border-white/5"'
);

fs.writeFileSync('src/components/FAIView.tsx', code);
