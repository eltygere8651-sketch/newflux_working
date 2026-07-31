const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexButtons = /<button \n                onClick=\{\(\) => \{\n                  window\.dispatchEvent\(new Event\("preview-onboarding"\)\);\n                \}\} \n                className="px-5 py-2\.5 bg-white\/5 hover:bg-white\/10 text-white border border-white\/10 text-xs font-bold rounded-full uppercase tracking-wider transition-all"\n              >\n                Vista Previa\n              <\/button>/;

const newButtons = `<button 
                onClick={() => {
                  window.dispatchEvent(new Event("preview-onboarding"));
                }} 
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-full uppercase tracking-wider transition-all"
              >
                Vista Previa Android
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("preview-onboarding", { detail: { forceIOS: true } }));
                }} 
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-full uppercase tracking-wider transition-all"
              >
                Vista Previa iOS
              </button>`;

if (content.match(regexButtons)) {
  content = content.replace(regexButtons, newButtons);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success NewsView");
} else {
  console.log("Not found in NewsView");
}
