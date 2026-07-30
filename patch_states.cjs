const fs = require('fs');
const path = 'src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

const strToRemove = `  const [annCategory, setAnnCategory] = useState<
    "noticia" | "urgente" | "mantenimiento" | "actualizacion"
  >("noticia");
  const [isPublishing, setIsPublishing] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState("");
`;

content = content.replace(strToRemove, "");

fs.writeFileSync(path, content, 'utf8');
