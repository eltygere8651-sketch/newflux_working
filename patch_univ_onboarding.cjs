const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldInterface = `interface UniversalOnboardingProps {
  onComplete: () => void;
}`;

const newInterface = `interface UniversalOnboardingProps {
  onComplete: () => void;
  cards?: any[];
}`;

content = content.replace(oldInterface, newInterface);

const oldComponent = `export function UniversalOnboarding({ onComplete }: UniversalOnboardingProps) {`;
const newComponent = `export function UniversalOnboarding({ onComplete, cards = [] }: UniversalOnboardingProps) {`;

content = content.replace(oldComponent, newComponent);

const oldModular = `  // SISTEMA MODULAR DE TARJETAS
  // Puedes añadir más tarjetas aquí según sea necesario (videos, guías, etc.)
  const modularCards = [
    // Ejemplo de tarjeta adicional (puedes descomentar o añadir más)
    /*
    {
      id: "guide-1",
      type: "guide",
      title: "Explora la Comunidad",
      description: "Descubre nuevas playlists creadas por otros usuarios y guarda tus favoritas con un solo toque.",
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      buttonText: "Ver guía rápida",
      onClick: () => console.log("Abrir guía")
    }
    */
  ];`;

content = content.replace(oldModular, `  const modularCards = cards;`);

const oldMap = `                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 transition-colors">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                  {card.buttonText && (
                    <button 
                      onClick={card.onClick}
                      className="shrink-0 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      {card.buttonText}
                    </button>
                  )}`;

const newMap = `                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center w-full">
                    {card.image && (
                      <div className="w-full sm:w-32 aspect-video sm:aspect-square shrink-0 rounded-xl overflow-hidden bg-black relative border border-white/10">
                        {card.image.match(/\\.(jpeg|jpg|gif|png|webp)$/i) || card.image.includes('/image/') ? (
                           <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                           <video src={card.image} controls preload="metadata" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/10 transition-colors">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{card.description}</p>
                      </div>
                    </div>
                  </div>`;

content = content.replace(oldMap, newMap);

fs.writeFileSync(path, content, 'utf8');
