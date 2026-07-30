const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="w-px h-3 bg-white\/20 mx-1" \/>/;
const newBtn = `<button
                                  onClick={(e) => handleToggleActive(item, e)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-full transition-all cursor-pointer"
                                  title={item.active === false ? "Activar" : "Desactivar"}
                                >
                                  {item.active === false ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <div className="w-px h-3 bg-white/20 mx-1" />`;

content = content.replace(regex, newBtn);
fs.writeFileSync(path, content, 'utf8');
