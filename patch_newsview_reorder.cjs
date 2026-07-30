const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /  const handleCancelDelete = \(e: React\.MouseEvent\) => \{/;
const newFunc = `  const handleMoveOrder = async (item: Announcement, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeTab !== "onboarding") return;
    const items = filteredItems;
    const index = items.findIndex(a => a.id === item.id);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const targetItem = items[targetIndex];
    
    try {
      const itemOrder = item.order ?? index;
      const targetOrder = targetItem.order ?? targetIndex;
      
      await updateDoc(doc(db, "announcements", item.id), { order: targetOrder });
      await updateDoc(doc(db, "announcements", targetItem.id), { order: itemOrder });
      
      setAnnouncements(prev => prev.map(a => {
        if (a.id === item.id) return { ...a, order: targetOrder };
        if (a.id === targetItem.id) return { ...a, order: itemOrder };
        return a;
      }));
    } catch(err) {
      console.error(err);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {`;

if (content.match(regex)) {
  content = content.replace(regex, newFunc);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
