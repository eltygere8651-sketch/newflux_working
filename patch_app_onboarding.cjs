const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /  useEffect\(\(\) => \{\n    const unsub1 = onSnapshot\(doc\(db, "config", "onboarding"\), \(docSnap\) => \{[\s\S]*?return \(\) => \{ unsub1\(\); unsub2\(\); window\.removeEventListener\("preview-onboarding", handlePreview\); \};\n  \}, \[\]\);/;

const newEffect = `  useEffect(() => {
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
          const cards = cardsSnap.docs.filter(d => d.data().active !== false).map(d => {
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
          }).sort((a,b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);
          
          if (!isMounted) return;
          setOnboardingCards(cards);
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error("Error comprobando onboarding:", e);
      }
    };

    checkOnboarding();
    
    const handlePreview = async () => {
      try {
        const qCards = query(collection(db, "announcements"), where("category", "==", "onboarding"));
        const cardsSnap = await getDocs(qCards);
        const cards = cardsSnap.docs.filter(d => d.data().active !== false).map(d => {
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
        }).sort((a,b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);
        
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

if (content.match(regex)) {
  content = content.replace(regex, newEffect);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
