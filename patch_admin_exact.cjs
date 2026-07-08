const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// The file has ~1500 lines. Let's just remove anything with ElevenLabs
const lines = code.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('// ElevenLabs Configuration')) skip = true;
  if (skip && line.includes('// Firebase Data Loading')) skip = false;
  if (skip && line.includes('const fetchAllData')) {
     skip = false;
  }
  
  if (line.includes('if (elevenLabsApiKey')) skip = true;
  if (skip && line.includes('checkElevenLabsVoice(')) {
    // skip these 3 lines
    newLines.pop(); // remove previous if
  }
  if (line.includes('{/* ElevenLabs Configuration Section */}')) {
     skip = true;
  }
  if (skip && line.includes('{/* Admin Config */}')) {
     skip = false;
  }
  
  if (!skip) newLines.push(line);
}

// Write the lines and clean up remaining uses manually with regex
fs.writeFileSync('src/components/UserManagementAdmin.tsx', newLines.join('\n'));
