const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexUseEffect = /  useEffect\(\(\) => \{\n    let isMounted = true;\n    \n    const checkOnboarding = async \(\) => \{[\s\S]*?window\.removeEventListener\("preview-onboarding", handlePreview\);\n    \};\n  \}, \[\]\);/;

const newUseEffect = `  useEffect(() => {
    let isMounted = true;
    
    const checkOnboarding = async () => {
      try {
        const completedStr = localStorage.getItem("flux_onboarding_version");
        const completedVersion = completedStr ? parseInt(completedStr, 10) : 0;
        
        // 1. Fetch current version from Firestore ONLY ONCE (no listeners)
        const configRef = doc(db, "config", "onboarding");
        const docSnap = await getDoc(configRef);
        
        let currentVersion = 1;
        if (docSnap.exists()) {
          const v = docSnap.data().version;
          if (typeof v === 'number' && !isNaN(v)) {
            currentVersion = v;
          }
        }
        
        if (!isMounted) return;
        setOnboardingVersion(currentVersion);
        
        // 2. Check if we need to show onboarding
        if (currentVersion > completedVersion || (currentVersion === 1 && completedVersion < 1)) {
          // Fetch cards ONLY if we are going to show the onboarding
          const qCards = query(collection(db, "announcements"), where("category", "==", "onboarding"));
          const cardsSnap = await getDocs(qCards);
          
          const isIosDevice =
            (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
            !(window as any).MSStream;

          const cards = cardsSnap.docs
            .filter(d => {
              const data = d.data();
              if (data.active === false) return false;
              const targetOS = data.targetOS || "all";
              if (targetOS === "ios" && !isIosDevice) return false;
              if (targetOS === "android" && isIosDevice) return false;
              return true;
            })
            .map(d => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title || "",
                description: data.content || "",
                image: data.videoUrl || "",
                createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime()) : 0,
                order: data.order || 0,
                actionText: data.actionText || "",
                actionUrl: data.actionUrl || ""
              };
            })
            .sort((a,b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);
          
          if (!isMounted) return;
          setOnboardingCards(cards);
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error("Error comprobando onboarding:", e);
      }
    };

    checkOnboarding();
    
    const handlePreview = async (e: Event) => {
      try {
        const forceIOSPreview = (e as CustomEvent).detail?.forceIOS === true;
        setForceIOS(forceIOSPreview);

        const qCards = query(collection(db, "announcements"), where("category", "==", "onboarding"));
        const cardsSnap = await getDocs(qCards);
        
        // Use the forced OS for preview filtering
        const cards = cardsSnap.docs
          .filter(d => {
            const data = d.data();
            if (data.active === false) return false;
            const targetOS = data.targetOS || "all";
            if (targetOS === "ios" && !forceIOSPreview) return false;
            if (targetOS === "android" && forceIOSPreview) return false;
            return true;
          })
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || "",
              description: data.content || "",
              image: data.videoUrl || "",
              createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime()) : 0,
              order: data.order || 0,
              actionText: data.actionText || "",
              actionUrl: data.actionUrl || ""
            };
          })
          .sort((a,b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);
        
        setOnboardingCards(cards);
        setShowOnboarding(true);
      } catch (e) {
        console.error(e);
      }
    };
    
    window.addEventListener("preview-onboarding", handlePreview);
    
    return () => {
      isMounted = false;
      window.removeEventListener("preview-onboarding", handlePreview);
    };
  }, []);`;

if (content.match(regexUseEffect)) {
  content = content.replace(regexUseEffect, newUseEffect);
  
  // Add forceIOS state
  const stateRegex = /const \[showOnboarding, setShowOnboarding\] = useState\(false\);/;
  if (content.match(stateRegex)) {
    content = content.replace(stateRegex, `const [showOnboarding, setShowOnboarding] = useState(false);\n  const [forceIOS, setForceIOS] = useState(false);`);
  }
  
  // Update UniversalOnboarding rendering
  const renderRegex = /<UniversalOnboarding\s*cards=\{onboardingCards\}/;
  if (content.match(renderRegex)) {
    content = content.replace(renderRegex, `<UniversalOnboarding \n        forceIOS={forceIOS}\n        cards={onboardingCards}`);
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("Success App.tsx");
} else {
  console.log("Not found in App.tsx");
}
