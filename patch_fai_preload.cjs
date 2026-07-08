const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// Insert ref
const refInsert = `  const preloadedWelcomeRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/radio/welcome")
      .then(res => res.json())
      .then(data => {
        preloadedWelcomeRef.current = data;
      })
      .catch(() => {});
  }, []);
`;

code = code.replace('  const welcomeRequestIdRef = useRef<number>(0);', '  const welcomeRequestIdRef = useRef<number>(0);\n' + refInsert);

// Replace fetch logic
const fetchRegex = /    try \{\n      const res = await fetch\("\/api\/radio\/welcome"\);\n      if \(myRequestId !== welcomeRequestIdRef\.current\) \{\n        return;\n      \}\n      if \(res\.ok\) \{\n        const data = await res\.json\(\);/g;

const newFetch = `    try {
      let data;
      if (preloadedWelcomeRef.current) {
        data = preloadedWelcomeRef.current;
        preloadedWelcomeRef.current = null;
        fetch("/api/radio/welcome")
          .then(res => res.json())
          .then(d => { preloadedWelcomeRef.current = d; })
          .catch(() => {});
      } else {
        const res = await fetch("/api/radio/welcome");
        if (res.ok) {
          data = await res.json();
        }
      }

      if (myRequestId !== welcomeRequestIdRef.current) {
        return;
      }
      if (data) {`;

code = code.replace(fetchRegex, newFetch);

fs.writeFileSync('src/components/FAIView.tsx', code);
