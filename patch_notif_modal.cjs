const fs = require('fs');
const path = 'src/components/NotificationsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldInt = `export interface Announcement {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  category: "mantenimiento" | "noticia" | "actualizacion" | "urgente" | "comunidad" | "destacado" | "guia" | string;
  createdAt: any;
  active?: boolean;
}`;

const newInt = `export interface Announcement {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  category: "mantenimiento" | "noticia" | "actualizacion" | "urgente" | "comunidad" | "destacado" | "guia" | string;
  createdAt: any;
  active?: boolean;
  order?: number;
  actionText?: string;
  actionUrl?: string;
}`;

if(content.includes(oldInt)) {
  content = content.replace(oldInt, newInt);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
