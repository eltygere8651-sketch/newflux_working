const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const target = `iv_load_policy: 3
                    }
                  }`;
const replacement = `iv_load_policy: 3,
                      origin: window.location.origin
                    }
                  }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Added origin to VideoView ReactPlayer");
    fs.writeFileSync('src/components/VideoView.tsx', code);
} else {
    console.log("Could not find config in VideoView");
}
