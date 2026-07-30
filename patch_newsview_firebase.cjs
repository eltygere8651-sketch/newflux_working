const fs = require('fs');

const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace onSnapshot logic
content = content.replace(
  `        unsubscribe = onSnapshot(q, (snap) => {
          const firebaseList: Announcement[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            firebaseList.push({
              id: docSnap.id,
              title: data.title || "",
              content: data.content || "",
              videoUrl: data.videoUrl || "",
              category: data.category || "noticia",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              active: data.active !== false,
            });
          });

          const allCombined = [
            ...firebaseList,
            ...COMPILED_UPDATES,
            ...COMPILED_COMMUNITY,
            ...COMPILED_FEATURED,
            ...COMPILED_GUIDES,
          ];`,
  `        unsubscribe = onSnapshot(q, (snap) => {
          const firebaseList: Announcement[] = [];
          const deletedIds = new Set<string>();
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.deleted) {
              deletedIds.add(docSnap.id);
            } else {
              firebaseList.push({
                id: docSnap.id,
                title: data.title || "",
                content: data.content || "",
                videoUrl: data.videoUrl || "",
                category: data.category || "noticia",
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                active: data.active !== false,
              });
            }
          });

          const allCombined = [
            ...firebaseList,
            ...COMPILED_UPDATES,
            ...COMPILED_COMMUNITY,
            ...COMPILED_FEATURED,
            ...COMPILED_GUIDES,
          ].filter(item => !deletedIds.has(item.id));`
);

// Replace handleDelete
content = content.replace(
  `    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (!isBuiltIn) {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {`,
  `    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (isBuiltIn) {
        await setDoc(doc(db, "announcements", id), { deleted: true, createdAt: new Date() });
      } else {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done NewsView!');
