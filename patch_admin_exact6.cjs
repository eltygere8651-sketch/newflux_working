const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code += `
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
