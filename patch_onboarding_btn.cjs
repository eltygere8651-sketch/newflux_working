const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">\{card\.description\}<\/p>\n                      <\/div>\n                    <\/div>\n                  <\/div>\n                <\/motion\.div>/m;
const newBtn = `<p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{card.description}</p>
                        {card.actionText && card.actionUrl && (
                          <div className="mt-4">
                            <button
                              onClick={() => window.open(card.actionUrl, "_blank")}
                              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-2 rounded-full font-bold transition-all text-xs border border-white/5"
                            >
                              <span>{card.actionText}</span>
                              <ChevronRight className="w-3 h-3 opacity-70" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>`;

content = content.replace(regex, newBtn);
fs.writeFileSync(path, content, 'utf8');
