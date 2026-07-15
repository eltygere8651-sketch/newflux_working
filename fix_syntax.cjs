const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldStr = ') : null)}\\n                      {supportChatMessages.map((msg: any) => {';
const newStr = ') : null}\n                      {supportChatMessages.map((msg: any) => {';
code = code.replace(') : null)}\n                      {supportChatMessages.map((msg: any) => {', newStr);

fs.writeFileSync('src/App.tsx', code);
