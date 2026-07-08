const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const oldLines = `              )}
        </div>
          )}
          
        {/* Mobile Fixed Close Button */}`;

const newLines = `              )}
            </div>
          )}
        </div>
          
        {/* Mobile Fixed Close Button */}`;

code = code.replace(oldLines, newLines);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
