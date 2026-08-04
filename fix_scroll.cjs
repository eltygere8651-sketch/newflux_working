const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const target = `    if (playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }`;

const replacement = `    setTimeout(() => {
      if (playerContainerRef.current) {
        playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Fixed scrollIntoView in VideoView.tsx");
    fs.writeFileSync('src/components/VideoView.tsx', code);
} else {
    console.log("Could not find target in VideoView.tsx");
}
