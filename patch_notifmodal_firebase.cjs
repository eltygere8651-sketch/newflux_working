const fs = require('fs');

const path = 'src/components/NotificationsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `      unsubscribe = onSnapshot(q, (querySnap) => {
        const firebaseList: Announcement[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          const ca = data.createdAt;
          const parsedDate = ca ? (typeof ca.toDate === 'function' ? ca.toDate() : new Date(ca)) : new Date();
          firebaseList.push({
            id: docSnap.id,
            title: data.title || "Aviso",
            content: data.content || "",
            videoUrl: data.videoUrl || "",
            category: data.category || "noticia",
            createdAt: parsedDate
          });
        });

        // Merge realtime database announcements with compiled app updates
        const combined = [...firebaseList, ...COMPILED_UPDATES];`,
  `      unsubscribe = onSnapshot(q, (querySnap) => {
        const firebaseList: Announcement[] = [];
        const deletedIds = new Set<string>();
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.deleted) {
            deletedIds.add(docSnap.id);
          } else {
            const ca = data.createdAt;
            const parsedDate = ca ? (typeof ca.toDate === 'function' ? ca.toDate() : new Date(ca)) : new Date();
            firebaseList.push({
              id: docSnap.id,
              title: data.title || "Aviso",
              content: data.content || "",
              videoUrl: data.videoUrl || "",
              category: data.category || "noticia",
              createdAt: parsedDate
            });
          }
        });

        // Merge realtime database announcements with compiled app updates
        const combined = [...firebaseList, ...COMPILED_UPDATES].filter(item => !deletedIds.has(item.id));`
);

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
console.log('Done NotificationsModal!');
