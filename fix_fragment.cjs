const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `) : (
                      (suggestedMessage ? (`;
const replacement = `) : (
                      <>
                        {suggestedMessage ? (`;
code = code.replace(target, replacement);

const target2 = `) : null}
                      {supportChatMessages.map((msg: any) => {`;
const replacement2 = `) : null}
                        {supportChatMessages.map((msg: any) => {`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
