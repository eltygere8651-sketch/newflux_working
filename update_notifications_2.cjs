const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const newUpdate = `  {
    id: "update-v1.8.2",
    title: "✨ Actualización Flux v1.8.2 - Nueva Radio, Comunidad y Persistencia",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Rebrand y Rediseño de Radio: Nueva estética inmersiva en la pestaña de radio eliminando etiquetas técnicas excesivas.\\n• Experiencia de Radio Directa: Eliminamos las alocuciones forzadas de Sofía para priorizar la reproducción musical.\\n• Mix de Sofía Libre: 'La mezcla de Sofia' ahora está disponible para todos los usuarios.\\n• Memoria Inteligente: La app ahora guarda tu último género y canción escuchada en la radio para que retomes justo donde lo dejaste.\\n• Visibilidad en Comunidad: Ahora los nombres de los creadores de playlists son claramente visibles incluso en pantallas de teléfonos móviles.\\n• Correcciones generales: Mejoras de estabilidad, transiciones y rendimiento en toda la plataforma."
  },
`;

code = code.replace(
  'export const COMPILED_UPDATES: Announcement[] = [',
  'export const COMPILED_UPDATES: Announcement[] = [\n' + newUpdate
);

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log("Updated NotificationsModal.tsx");
