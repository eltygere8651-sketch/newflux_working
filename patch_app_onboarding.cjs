const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldState = `  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const completedVersion = parseInt(localStorage.getItem("flux_onboarding_version") || "0", 10);
    if (completedVersion < ONBOARDING_VERSION) {
      setShowOnboarding(true);
    }
  }, []);`;

const newState = `  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingVersion, setOnboardingVersion] = useState(1);
  const [onboardingCards, setOnboardingCards] = useState<any[]>([]);
  
  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, "config", "onboarding"), (docSnap) => {
      if (docSnap.exists()) {
        const v = docSnap.data().version || 1;
        setOnboardingVersion(v);
        const completedVersion = parseInt(localStorage.getItem("flux_onboarding_version") || "0", 10);
        if (completedVersion < v) {
          setShowOnboarding(true);
        }
      } else {
        const completedVersion = parseInt(localStorage.getItem("flux_onboarding_version") || "0", 10);
        if (completedVersion < 1) {
          setShowOnboarding(true);
        }
      }
    });

    const qCards = query(collection(db, "announcements"), where("category", "==", "onboarding"));
    const unsub2 = onSnapshot(qCards, (snap) => {
      const cards = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "",
          description: data.content || "",
          image: data.videoUrl || "",
          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime()) : 0
        };
      }).sort((a,b) => a.createdAt - b.createdAt);
      setOnboardingCards(cards);
    });

    return () => { unsub1(); unsub2(); };
  }, []);`;

content = content.replace(oldState, newState);

const oldRender = `  if (showOnboarding) {
    return (
      <UniversalOnboarding 
        onComplete={() => {
          localStorage.setItem("flux_onboarding_version", ONBOARDING_VERSION.toString());
          setShowOnboarding(false);
        }} 
      />
    );
  }`;

const newRender = `  if (showOnboarding) {
    return (
      <UniversalOnboarding 
        cards={onboardingCards}
        onComplete={() => {
          localStorage.setItem("flux_onboarding_version", onboardingVersion.toString());
          setShowOnboarding(false);
        }} 
      />
    );
  }`;

content = content.replace(oldRender, newRender);

fs.writeFileSync(path, content, 'utf8');
