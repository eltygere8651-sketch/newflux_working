const fs = require('fs');

const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const [isUploading, setIsUploading] = useState(false);',
  'const [isUploading, setIsUploading] = useState(false);\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);'
);

content = content.replace(
  `  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return;
    try {
      const isBuiltIn = id.startsWith("update-v") || id.startsWith("community-") || id.startsWith("featured-") || id.startsWith("guide-");
      if (!isBuiltIn) {
        await deleteDoc(doc(db, "announcements", id));
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      alert("No se pudo eliminar: " + err);
    }
  };`,
  `  const handleDelete = async (id: string, e: React.MouseEvent) => {
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
      console.error("No se pudo eliminar: " + err);
    }
  };
  
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(null);
  };`
);

content = content.replace(
  `                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-full transition-all cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`,
  `                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className={\`p-1 rounded-full transition-all cursor-pointer flex items-center gap-1 \${
                                deleteConfirmId === item.id
                                  ? "bg-rose-500 text-white hover:bg-rose-600 px-2"
                                  : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                              }\`}
                              title={deleteConfirmId === item.id ? "Confirmar eliminar" : "Eliminar"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deleteConfirmId === item.id && <span className="text-[9px] font-bold uppercase tracking-wider">¿Borrar?</span>}
                            </button>
                            {deleteConfirmId === item.id && (
                              <button
                                onClick={handleCancelDelete}
                                className="p-1 px-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                                title="Cancelar"
                              >
                                X
                              </button>
                            )}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
