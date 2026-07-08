const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// Remove the state and functions for elevenlabs
const stateRegex = /  \/\/ ElevenLabs Configuration[\s\S]*?  const \[elevenLabsErrorMsg, setElevenLabsErrorMsg\] = useState<string>\(""\);/g;
code = code.replace(stateRegex, '');

const checkVoiceRegex = /  const checkElevenLabsVoice = async \(apiKeyToTest: string, voiceIdToTest: string\) => \{[\s\S]*?  \};\n/g;
code = code.replace(checkVoiceRegex, '');

const useEffectRegex = /    if \(elevenLabsApiKey && elevenLabsVoiceId\) \{[\s\S]*?    \}\n/g;
code = code.replace(useEffectRegex, '');

const uiRegex = /              \{\/\* ElevenLabs Configuration Section \*\/\}[\s\S]*?              \{\/\* Admin Config \*\/\} /g;
code = code.replace(uiRegex, '              {/* Admin Config */} ');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
