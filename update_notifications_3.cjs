const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const newUpdate = `  {
    id: "update-v1.8.3",
    title: "✨ Actualización Flux v1.8.3 - Reparación Profunda: Algoritmo de Mezcla FLX y Descubrimiento Infinito",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Solución del Algoritmo de Novedades: Reparado el fallo crítico en la sección 'Ajuste de Mezcla FLX' que causaba que la radio reprodujera las mismas 4 canciones repetidas o saltara canciones rotas cuando se aumentaba la barra de 'Descubrimiento nuevo' a más del 50%.\\n• Descubrimiento Infinito Real: Ahora, cuando ajustas tu mezcla para priorizar el descubrimiento, el algoritmo de Flux Radio no se limita a una base local pequeña, sino que utiliza una inteligencia de búsqueda masiva hacia toda la red para ofrecer una cola de reproducción verdaderamente infinita, sin pistas rotas ni bucles repetitivos.\\n• Integridad del Ecosistema: Los ajustes fueron inyectados quirúrgicamente solo en el motor de descubrimiento DJ, asegurando que ninguna otra funcionalidad de tu radio o tus demás controles se vea afectada. Las listas de la comunidad, búsqueda, favoritos y tus preferencias actuales siguen funcionando perfectamente."
  },
`;

code = code.replace(
  'export const COMPILED_UPDATES: Announcement[] = [',
  'export const COMPILED_UPDATES: Announcement[] = [\n' + newUpdate
);

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log("Updated NotificationsModal.tsx");
