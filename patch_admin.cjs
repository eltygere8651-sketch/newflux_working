const fs = require('fs');
const path = 'src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove states
const statesToRemove = `  // Announcement composition states
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annVideoUrl, setAnnVideoUrl] = useState("");
  const [isUploadingAnn, setIsUploadingAnn] = useState(false);

  const handleAnnFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Por favor configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tus variables de entorno para usar esta función.");
      return;
    }

    const isVideo = file.type.startsWith('video/');
    
    setIsUploadingAnn(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        \`https://api.cloudinary.com/v1_1/\${cloudName}/\${isVideo ? "video" : "image"}/upload\`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        setAnnVideoUrl(data.secure_url);
      } else {
        throw new Error(data.error?.message || "Error al subir el archivo");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(\`Error al subir a Cloudinary: \${error.message}\`);
    } finally {
      setIsUploadingAnn(false);
    }
  };

  const [annCategory, setAnnCategory] = useState<
    "noticia" | "urgente" | "mantenimiento" | "actualizacion"
  >("noticia");
  const [isPublishing, setIsPublishing] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState("");
`;

content = content.replace(statesToRemove, "");


// 2. Remove functions
const functionsToRemove = `  const publishAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) {
      alert("Por favor completa el título y el contenido del comunicado.");
      return;
    }

    try {
      setIsPublishing(true);
      setAnnSuccessMsg("");

      const randId = "ann_" + Math.random().toString(36).substring(2, 11);
      const docRef = doc(db, "announcements", randId);
      const annData: any = {
        title: annTitle.trim(),
        content: annContent.trim(),
        category: annCategory,
        createdAt: new Date(),
        active: true,
      };
      
      if (annVideoUrl.trim()) {
        annData.videoUrl = annVideoUrl.trim();
      }

      await setDoc(docRef, annData);
      setAnnTitle("");
      setAnnContent("");
      setAnnVideoUrl("");
      setAnnCategory("noticia");

      setAnnSuccessMsg(
        "¡Comunicado global publicado con éxito en la base de datos de FLUX!",
      );
      setTimeout(() => setAnnSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Error publicando anuncio:", err);
      alert("Error al publicar el anuncio: " + err);
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteActiveAnnouncement = async () => {
    try {
      const { query, collection, orderBy, limit, getDocs, updateDoc } =
        await import("firebase/firestore");
      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { active: false });
        alert(
          "El comunicado activo ha sido eliminado y ocultado de los usuarios (Refresca la app para ver los cambios).",
        );
      } else {
        alert("No hay ningún comunicado activo reciente para eliminar.");
      }
    } catch (err) {
      console.error(err);
      alert("Error eliminando comunicado");
    }
  };
`;
content = content.replace(functionsToRemove, "");


// 3. Regex for JSX block
// We need to match from "{/* SECCIÓN NUEVA: DIFUSION DE COMUNICADOS DEL ADMIN */}" up to just before "{/* SECCIÓN NUEVA: CONFIGURACIÓN DE TELEGRAM (COLAPSIBLE/DESPLEGABLE PREMIUM) */}"

const regexJSX = /\{\/\* SECCIÓN NUEVA: DIFUSION DE COMUNICADOS DEL ADMIN \*\/\}[\s\S]*?(?=\{\/\* SECCIÓN NUEVA: CONFIGURACIÓN DE TELEGRAM \(COLAPSIBLE\/DESPLEGABLE PREMIUM\) \*\/\}|\{\/\* SECCIÓN NUEVA: CONFIGURACIÓN DE TELEGRAM)/;

if (regexJSX.test(content)) {
  content = content.replace(regexJSX, "");
  console.log("Replaced JSX block");
} else {
  console.log("Could not find JSX block");
}

fs.writeFileSync(path, content, 'utf8');
