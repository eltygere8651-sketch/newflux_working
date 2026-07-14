const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const adjustFunc = `  const adjustSubDays = async (user: any, daysToAdjust: number) => {
    askConfirm(\`¿Confirmar \${daysToAdjust > 0 ? '+' : ''}\${daysToAdjust} día(s) para este usuario?\`, async () => {
      try {
        const msPerDay = 1000 * 60 * 60 * 24;
        let newEnd = user.subscriptionEnd;
        
        if (!newEnd || newEnd <= Date.now()) {
            if (user.trialStart && (user.trialStart + 7 * msPerDay) > Date.now()) {
                newEnd = user.trialStart + 7 * msPerDay;
            } else {
                newEnd = Date.now();
            }
        }
        
        newEnd += (daysToAdjust * msPerDay);
        
        const { updateDoc, doc } = require("firebase/firestore");
        await updateDoc(doc(db, "users", user.id), {
          subscriptionEnd: newEnd,
          plan: "premium"
        });
        
        showAlert(\`Días ajustados correctamente.\`);
        fetchUsers();
      } catch (e) {
        console.error(e);
        showAlert("Error al ajustar días.");
      }
    });
  };

  const removeSub = async (userId: string) => {`;

code = code.replace(/  const removeSub = async \(userId: string\) => {/g, adjustFunc);

const buttonsHtml = `                           <button 
                             onClick={() => updateSub(u.id, "12mo", 365)} 
                             className="py-2.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-300 text-[10px] font-black rounded-xl transition-all border border-amber-500/20 cursor-pointer text-center"
                             title="Activar por 12 Meses"
                           >
                             12M
                           </button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                           <button 
                             onClick={() => adjustSubDays(u, -1)} 
                             className="py-2.5 bg-gray-500/10 hover:bg-gray-500/20 active:scale-[0.98] text-gray-300 text-[10px] font-black rounded-xl transition-all border border-gray-500/20 cursor-pointer text-center"
                           >
                             - 1 DÍA
                           </button>
                           <button 
                             onClick={() => adjustSubDays(u, 1)} 
                             className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[10px] font-black rounded-xl transition-all border border-emerald-500/20 cursor-pointer text-center"
                           >
                             + 1 DÍA
                           </button>
                         </div>`;

code = code.replace(/                           <button [\s\S]*?onClick=\{\(\) => updateSub\(u.id, "12mo", 365\)\}[\s\S]*?12M\n                           <\/button>\n                         <\/div>/, buttonsHtml);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log('Added adjust days feature');
