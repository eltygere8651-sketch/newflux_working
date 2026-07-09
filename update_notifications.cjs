const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const newUpdate = `  {
    id: "update-v1.8.1",
    title: "✨ Actualización Flux v1.8.1 - Nueva Radio Flux, Retorno de Sofia y Estado Persistente",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Rebrand de la Radio: Mejoramos la estética del reproductor de la radio eliminando la etiqueta de 'FLUX AI ENGINE' para una vista más inmersiva e limpia.\\n• Alocuciones Simplificadas: Removidas las interrupciones forzadas y alocuciones obligatorias de bienvenida para dar paso a una experiencia musical más directa.\\n• La mezcla de Sofia para todos: El exclusivo mix de Sofia se ha habilitado para que todos los usuarios puedan seleccionarlo.\\n• Estado de Radio Persistente: Ahora la aplicación recuerda automáticamente la última canción y el último género que estabas escuchando, retomándolo inmediatamente cuando vuelvas.\\n• Correcciones Menores y UI: Numerosas mejoras de estabilidad, manejo de colas y consistencia visual en la pestaña de radio."
  },
`;

code = code.replace(
  'export const COMPILED_UPDATES: Announcement[] = [',
  'export const COMPILED_UPDATES: Announcement[] = [\n' + newUpdate
);

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log("Updated NotificationsModal.tsx");
