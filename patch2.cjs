const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf8');
code = code.replace("      if (!u) {\n        // Recover VIP guest session if available\n        const uuid = localStorage.getItem('flux_vip_device_id');", "      if (!u) {\n        if (localStorage.getItem('flux_voluntary_logout') === 'true') {\n          setDbUserProfile(null);\n          setAccessData(null);\n          setLoading(false);\n          return;\n        }\n\n        // Recover VIP guest session if available\n        const uuid = localStorage.getItem('flux_vip_device_id');");
code = code.replace("      if (u) {\n        // Fetch from Firestore without active websocket to save concurrents", "      if (u) {\n        localStorage.removeItem('flux_voluntary_logout');\n\n        // Fetch from Firestore without active websocket to save concurrents");
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
