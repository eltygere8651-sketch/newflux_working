const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetLogic = `                <div className="flex flex-col gap-3 w-full">
                  {((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) || (accessData.plan !== "none" && accessData.plan !== "free") ? (
                    <button
                      onClick={async () => {
                        try {
                          const emailVal = user?.email || "Anónimo";
                          const nameVal = user?.displayName || "Socio Contigo";
                          const currentUserId = user?.uid || "guest_uid";
                          
                          const newMsgObj = {
                            userId: currentUserId,
                            userEmail: emailVal,
                            userName: nameVal,
                            message: \`¡Hola! Quiero hacerme Premium por 5 €/mes. Mi correo es \${emailVal}.\`,
                            createdAt: Date.now(),
                            isAdminReply: false,
                            readByAdmin: false,
                            readByUser: true,
                          };
                          const { addDoc, collection } = await import("firebase/firestore");
                          const { db } = await import("../lib/firebase");
                          await addDoc(collection(db, "support_messages"), newMsgObj);
                          
                          window.dispatchEvent(new Event("openSupportModal"));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >
                      <span>💬 CONTACTAR PARA ACTIVAR PREMIUM</span>
                    </button>
                  ) : isCheckingTrialRequest ? (
                    <div className="flex items-center justify-center p-3 text-blue-400 font-bold text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  ) : trialRequestStatus === "idle" ? (
                    <button
                      onClick={handleRequestTrial}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20 animate-pulse hover:animate-none"
                    >
                      <span>⚡ Pedir Acceso Gratis de 7 Días</span>
                    </button>
                  ) : (
                    <div
                      className={\`p-3 rounded-2xl border text-[10px] sm:text-[11px] font-semibold leading-relaxed text-center \${
                        trialRequestStatus === "sent"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/10 text-red-400"
                      }\`}
                    >
                      {trialRequestMsg}
                    </div>
                  )}
                </div>`;

const replaceLogic = `                <div className="flex flex-col gap-3 w-full">
                  {/* Si NO tienen plan (o es free sin trialStart) pueden pedir prueba. Si ya la pidieron ven mensaje */}
                  {!((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) && !(accessData.plan !== "none" && accessData.plan !== "free") && (
                    isCheckingTrialRequest ? (
                      <div className="flex items-center justify-center p-3 text-blue-400 font-bold text-xs gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Procesando...</span>
                      </div>
                    ) : trialRequestStatus === "idle" ? (
                      <button
                        onClick={handleRequestTrial}
                        className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20 animate-pulse hover:animate-none"
                      >
                        <span>⚡ Pedir Acceso Gratis de 7 Días</span>
                      </button>
                    ) : (
                      <div
                        className={\`p-3 rounded-2xl border text-[10px] sm:text-[11px] font-semibold leading-relaxed text-center \${
                          trialRequestStatus === "sent"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border-red-500/10 text-red-400"
                        }\`}
                      >
                        {trialRequestMsg}
                      </div>
                    )
                  )}

                  {/* Siempre mostramos el boton de contactar si ya probaron, si expiró su subs, o si fueron declinados/pendientes */}
                  {( ((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) || (accessData.plan !== "none" && accessData.plan !== "free") || (trialRequestStatus !== "idle" && !isCheckingTrialRequest) ) && (
                    <button
                      onClick={async () => {
                        try {
                          const emailVal = user?.email || "Anónimo";
                          const nameVal = user?.displayName || "Socio Contigo";
                          const currentUserId = user?.uid || "guest_uid";
                          
                          let defaultMessage = "";
                          if (accessData.plan !== "none" && accessData.plan !== "free") {
                            defaultMessage = "Mi suscripción a Flux Music ha finalizado y quiero volver a disfrutar de todas las ventajas Premium. ¿Podéis ayudarme a reactivarla?";
                          } else {
                            defaultMessage = "Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.";
                          }
                          
                          const newMsgObj = {
                            userId: currentUserId,
                            userEmail: emailVal,
                            userName: nameVal,
                            message: defaultMessage,
                            createdAt: Date.now(),
                            isAdminReply: false,
                            readByAdmin: false,
                            readByUser: true,
                          };
                          const { addDoc, collection } = await import("firebase/firestore");
                          const { db } = await import("../lib/firebase");
                          await addDoc(collection(db, "support_messages"), newMsgObj);
                          
                          window.dispatchEvent(new Event("openSupportModal"));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >
                      <span>💬 CONTACTAR PARA ACTIVAR PREMIUM</span>
                    </button>
                  )}
                </div>`;

if (code.includes('<span>💬 CONTACTAR PARA ACTIVAR PREMIUM</span>')) {
  code = code.replace(targetLogic, replaceLogic);
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
  console.log('Fixed GymMusicPlayer logic');
} else {
  console.log('Target block not found');
}
