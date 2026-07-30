const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /  const handleMoveOrder/;
const newFunc = `  const handleToggleActive = async (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const newActiveState = item.active === false ? true : false;
      await updateDoc(doc(db, "announcements", item.id), { active: newActiveState });
      setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, active: newActiveState } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveOrder`;

content = content.replace(regex, newFunc);
fs.writeFileSync(path, content, 'utf8');
