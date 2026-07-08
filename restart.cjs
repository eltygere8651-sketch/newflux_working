const { execSync } = require('child_process');
execSync('npm run restart-dev', { stdio: 'inherit' });
