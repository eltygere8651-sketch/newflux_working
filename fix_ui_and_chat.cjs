const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetTrialStatus = `                    ) : (
                      <div
                        className={\`p-3 rounded-2xl border text-[10px] sm:text-[11px] font-semibold leading-relaxed text-center \${
                          trialRequestStatus === "sent"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border-red-500/10 text-red-400"
                        }\`}
                      >
                        {trialRequestMsg}
                      </div>
                    )`;

const replacementTrialStatus = `                    ) : trialRequestStatus === "sent" ? (
                      <div
                        className="p-3 rounded-2xl border text-[10px] sm:text-[11px] font-semibold leading-relaxed text-center bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      >
                        {trialRequestMsg}
                      </div>
                    ) : null`;

code = code.replace(targetTrialStatus, replacementTrialStatus);

const targetBtnAction = `                    <button
                      onClick={() => {
                        let defaultMessage = "";
                        if (accessData.plan !== "none" && accessData.plan !== "free") {
                          defaultMessage = "Mi suscripción a Flux Music ha finalizado y quiero volver a disfrutar de todas las ventajas Premium. ¿Podéis ayudarme a reactivarla?";
                        } else {
                          defaultMessage = "Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.";
                        }
                        window.dispatchEvent(new CustomEvent("open-support", { detail: { message: defaultMessage } }));
                      }}`;

const replacementBtnAction = `                    <button
                      onClick={() => {
                        const wantsAutoMsg = window.confirm("¿Deseas que generemos un mensaje automático para solicitar tu suscripción?");
                        if (wantsAutoMsg) {
                          let defaultMessage = "";
                          if (accessData.plan !== "none" && accessData.plan !== "free") {
                            defaultMessage = "Mi suscripción a Flux Music ha finalizado y quiero volver a disfrutar de todas las ventajas Premium. ¿Podéis ayudarme a reactivarla?";
                          } else {
                            defaultMessage = "Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.";
                          }
                          window.dispatchEvent(new CustomEvent("open-support", { detail: { message: defaultMessage } }));
                        } else {
                          window.dispatchEvent(new CustomEvent("open-support"));
                        }
                      }}`;

code = code.replace(targetBtnAction, replacementBtnAction);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log('Fixed UI and Chat');
