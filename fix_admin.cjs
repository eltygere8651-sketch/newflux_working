const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code = code.replace(/const \[users, setUsers\] = useState<any\[\]>\(\[\]\);/, 
  'const [users, setUsers] = useState<any[]>([]);\n  const [globalAnalytics, setGlobalAnalytics] = useState<any[]>([]);\n  const [loadingAnalytics, setLoadingAnalytics] = useState(false);');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log("Fixed Admin");
