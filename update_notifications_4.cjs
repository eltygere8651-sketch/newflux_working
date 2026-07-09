const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const newUpdate = `  {
    id: "update-v1.8.4",
    title: "✨ Actualización Flux v1.8.4 - Rediseño del Botón de Ajustes",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Ajustes Visibles y Llamativos: El botón de Configuración de Mezcla FLX ha sido rediseñado completamente. Ahora destaca con una estética vibrante y estructurada (color esmeralda con iluminación neón) que combina perfectamente con los acentos del reproductor principal, haciéndolo mucho más fácil de localizar y de usar."
  },
`;

code = code.replace(
  'export const COMPILED_UPDATES: Announcement[] = [',
  'export const COMPILED_UPDATES: Announcement[] = [\n' + newUpdate
);

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log("Updated NotificationsModal.tsx");
