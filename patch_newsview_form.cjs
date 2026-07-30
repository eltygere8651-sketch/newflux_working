const fs = require('fs');
const path = 'src/components/NewsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const \[formContent, setFormContent\] = useState\(""\);/;
const newStates = `const [formContent, setFormContent] = useState("");
  const [formActionText, setFormActionText] = useState("");
  const [formActionUrl, setFormActionUrl] = useState("");`;

content = content.replace(regex, newStates);

const regexOpenCreate = /setFormContent\(""\);\n    setIsModalOpen\(true\);/m;
const newOpenCreate = `setFormContent("");
    setFormActionText("");
    setFormActionUrl("");
    setIsModalOpen(true);`;
content = content.replace(regexOpenCreate, newOpenCreate);

const regexOpenEdit = /setFormContent\(item\.content\);\n    setIsModalOpen\(true\);/m;
const newOpenEdit = `setFormContent(item.content);
    setFormActionText(item.actionText || "");
    setFormActionUrl(item.actionUrl || "");
    setIsModalOpen(true);`;
content = content.replace(regexOpenEdit, newOpenEdit);

const regexSave = /content: formContent\.trim\(\),/m;
const newSave = `content: formContent.trim(),
        actionText: formActionText.trim(),
        actionUrl: formActionUrl.trim(),`;
content = content.replace(regexSave, newSave);

fs.writeFileSync(path, content, 'utf8');
