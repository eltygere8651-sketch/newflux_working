const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/<span>Perfil de Usuario<\/span>/g, '<span>Perfil</span>');
code = code.replace(/<span>Administración<\/span>/g, '<span>Admin</span>');
code = code.replace(/<span>Cerrar Sesión<\/span>/g, '<span>Salir</span>');
code = code.replace(/<span>Iniciar Sesión<\/span>/g, '<span>Entrar</span>');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed labels');
