const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

code = code.replace(/            \}\)\}\s*\{!isLoading[\s\S]*?<\/p>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>[\s\S]*$/, `            )}
            {!isLoading && videos.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 font-medium">No se encontraron vídeos. Intenta otra búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`);

fs.writeFileSync('src/components/VideoView.tsx', code);
