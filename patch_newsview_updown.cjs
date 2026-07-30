const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<button\s+onClick=\{\(e\) => handleOpenEdit\(item, e\)\}/;

const newButtons = `{activeTab === "onboarding" && (
                              <>
                                <button
                                  onClick={(e) => handleMoveOrder(item, 'up', e)}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleMoveOrder(item, 'down', e)}
                                  disabled={idx === filteredItems.length - 1}
                                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-px h-3 bg-white/20 mx-1" />
                              </>
                            )}
                            <button
                              onClick={(e) => handleOpenEdit(item, e)}`;

if (content.match(regex)) {
  content = content.replace(regex, newButtons);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
