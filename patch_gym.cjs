const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetUI = `
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-1 font-sans">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Acceso Restringido"
                    : "Gracias por probar Flux Music."}
                </h1>
                <p className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest text-[#1ED760] mb-3 sm:mb-5 px-3 bg-[#1ED760]/10 py-0.5 rounded-full border border-[#1ED760]/20">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Privado • Pendiente de Alta"
                    : "Membresía Expirada"}
                </p>
                <p className="text-[#a7a7a7] max-w-xs mx-auto mb-4 sm:mb-6 text-[10.5px] sm:text-xs font-medium leading-relaxed">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."
                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  {(accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart ? (
`;

const replaceUI = `
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-1 font-sans">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Acceso Restringido"
                    : accessData.plan !== "none" && accessData.plan !== "free"
                    ? "Suscripción Finalizada"
                    : "Gracias por probar Flux Music."}
                </h1>
                <p className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest text-[#1ED760] mb-3 sm:mb-5 px-3 bg-[#1ED760]/10 py-0.5 rounded-full border border-[#1ED760]/20">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Privado • Pendiente de Alta"
                    : "Membresía Expirada"}
                </p>
                <p className="text-[#a7a7a7] max-w-xs mx-auto mb-4 sm:mb-6 text-[10.5px] sm:text-xs font-medium leading-relaxed">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."
                    : accessData.plan !== "none" && accessData.plan !== "free"
                    ? "Tu suscripción ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."
                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  {((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) || (accessData.plan !== "none" && accessData.plan !== "free") ? (
`;

if (code.includes(targetUI.trim())) {
  code = code.replace(targetUI.trim(), replaceUI.trim());
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
  console.log('Patched UI logic');
} else {
  console.log('Could not find target block. Proceeding to find individual blocks');
}
