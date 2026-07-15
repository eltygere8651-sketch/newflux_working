const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                      })
                    )}
                    <div ref={supportChatEndRef} />`;
const replacement = `                      })
                    }
                    </>)}
                    <div ref={supportChatEndRef} />`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
