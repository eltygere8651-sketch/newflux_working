const fs = require('fs');

const path = 'src/components/NotificationsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);',
  'const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);'
);

content = content.replace(
  `  const handleDeleteAnnouncement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este anuncio permanentemente?")) return;
    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (!isBuiltIn) {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      alert("No se pudo eliminar el anuncio: " + err);
    }
  };`,
  `  const handleDeleteAnnouncement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    
    setDeleteConfirmId(null);
    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (!isBuiltIn) {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      console.error("No se pudo eliminar el anuncio: " + err);
    }
  };
  
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(null);
  };`
);

content = content.replace(
  `                        {isAdmin && !item.id.startsWith("update-") && (
                          <button
                            onClick={(e) => handleDeleteAnnouncement(item.id, e)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}`,
  `                        {isAdmin && !item.id.startsWith("update-") && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDeleteAnnouncement(item.id, e)}
                              className={\`transition-all flex items-center gap-1 rounded-full \${
                                deleteConfirmId === item.id 
                                ? "bg-rose-500 text-white hover:bg-rose-600 px-1.5 py-0.5" 
                                : "text-slate-500 hover:text-red-400"
                              }\`}
                            >
                              <Trash2 className="w-3 h-3" />
                              {deleteConfirmId === item.id && <span className="text-[8px] font-bold uppercase">¿Borrar?</span>}
                            </button>
                            {deleteConfirmId === item.id && (
                              <button
                                onClick={handleCancelDelete}
                                className="px-1.5 py-0.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full text-[8px] font-bold uppercase"
                              >
                                X
                              </button>
                            )}
                          </div>
                        )}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done NotificationsModal!');
