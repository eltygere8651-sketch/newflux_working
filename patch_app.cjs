const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importTarget = 'import { NotificationsModal, COMPILED_UPDATES } from "./components/NotificationsModal";';
const importReplacement = importTarget + '\nimport { ShareModal } from "./components/ShareModal";';
if (!code.includes('import { ShareModal }')) {
  code = code.replace(importTarget, importReplacement);
}

const stateTarget = '  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);';
const stateReplacement = stateTarget + '\n  const [isShareModalOpen, setIsShareModalOpen] = useState(false);';
if (!code.includes('isShareModalOpen')) {
  code = code.replace(stateTarget, stateReplacement);
}

const menuTarget = `                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); logout(); }}`;
const menuReplacement = `                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); setIsShareModalOpen(true); }}
                  className="w-full h-9 bg-transparent hover:bg-white/5 text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                >
                  <span className="text-[14px] ml-[1px]">❤️</span>
                  <span>Invitar amigos</span>
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); logout(); }}`;
if (!code.includes('Invitar amigos')) {
  code = code.replace(menuTarget, menuReplacement);
}

const modalTarget = `      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        isAdmin={isAdmin}
      />`;
const modalReplacement = modalTarget + `

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />`;
if (!code.includes('<ShareModal')) {
  code = code.replace(modalTarget, modalReplacement);
}

fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
