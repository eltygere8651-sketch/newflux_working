const fs = require('fs');
let data = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
if (!data.requestFramePermissions) {
    data.requestFramePermissions = [];
}
if (!data.requestFramePermissions.includes('microphone')) {
    data.requestFramePermissions.push('microphone');
}
fs.writeFileSync('metadata.json', JSON.stringify(data, null, 2));
console.log("Updated metadata.json");
