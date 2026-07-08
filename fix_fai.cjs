const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex1 = /  const preloadedWelcomeRef = useRef<any>\(null\);\n\n  useEffect\(\(\) => \{\n    fetch\("\/api\/radio\/welcome"\)\n      \.then\(res => res\.json\(\)\)\n      \.then\(data => \{\n        preloadedWelcomeRef\.current = data;\n      \}\)\n      \.catch\(\(\) => \{\}\);\n  \}, \[\]\);\n/g;

const newRef = `  const prefetchPromiseRef = useRef<Promise<any> | null>(null);

  const prefetchWelcome = () => {
    const p = fetch("/api/radio/welcome")
      .then(res => res.json())
      .catch(() => null);
    prefetchPromiseRef.current = p;
    return p;
  };

  useEffect(() => {
    prefetchWelcome();
  }, []);
`;

code = code.replace(regex1, newRef);

fs.writeFileSync('src/components/FAIView.tsx', code);
