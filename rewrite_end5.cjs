const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const anchor = '{!isLoading && videos.length === 0 && (';
const idx = code.lastIndexOf(anchor);
if (idx !== -1) {
    code = code.substring(0, idx) + `{!isLoading && videos.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 font-medium">No se encontraron vídeos. Intenta otra búsqueda.</p>
              </div>
            )}
  );
};
`;
    fs.writeFileSync('src/components/VideoView.tsx', code);
    console.log("Rewrote end again 5");
}
