const fs = require('fs');
const path = 'src/components/UniversalOnboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexProps = /interface UniversalOnboardingProps \{[\s\S]*?export function UniversalOnboarding\(\{ onComplete, cards = \[\] \}: UniversalOnboardingProps\) \{/s;

const newProps = `interface UniversalOnboardingProps {
  onComplete: () => void;
  cards?: any[];
  forceIOS?: boolean;
}

export function UniversalOnboarding({ onComplete, cards = [], forceIOS = false }: UniversalOnboardingProps) {`;

content = content.replace(regexProps, newProps);

const regexState = /const \[isIOS, setIsIOS\] = useState\(false\);/;
const newState = `const [isIOS, setIsIOS] = useState(forceIOS);

  useEffect(() => {
    if (forceIOS) {
      setIsIOS(true);
      return;
    }
    const isIosDevice =
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    setIsIOS(isIosDevice);
  }, [forceIOS]);`;

content = content.replace(regexState, newState);

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
