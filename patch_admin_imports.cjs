const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const analyticsImport = `import AnalyticsAdmin from "./AnalyticsAdmin";\nimport { BarChart2 } from "lucide-react";\n`;
if (!code.includes('import AnalyticsAdmin')) {
  code = code.replace(/import \{ db \} from "\.\.\/lib\/firebase";/, analyticsImport + 'import { db } from "../lib/firebase";');
}

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
