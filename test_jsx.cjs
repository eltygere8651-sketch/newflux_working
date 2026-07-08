const fs = require('fs');
const babel = require('@babel/core');
const files = [
  'src/App.tsx',
  'src/components/GymMusicPlayer.tsx',
  'src/components/ExploreView.tsx',
  'src/components/FAIView.tsx',
  'src/components/UserManagementAdmin.tsx'
];
files.forEach(file => {
  try {
    babel.parseSync(fs.readFileSync(file, 'utf8'), {
      filename: file,
      presets: ['@babel/preset-typescript', '@babel/preset-react']
    });
    console.log("Valid JSX in", file);
  } catch(e) {
    console.log("Error in", file, ":", e.message);
  }
});
