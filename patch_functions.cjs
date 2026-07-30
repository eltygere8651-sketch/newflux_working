const fs = require('fs');
const path = 'src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexPublish = /const publishAnnouncement = async \(\) => \{[\s\S]*?^\s*};\s*/m;
content = content.replace(regexPublish, "");

const regexDelete = /const deleteActiveAnnouncement = async \(\) => \{[\s\S]*?^\s*};\s*/m;
content = content.replace(regexDelete, "");

const regexStates = /\/\/ Announcement composition states[\s\S]*?const handleAnnFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?^\s*};\s*/m;
content = content.replace(regexStates, "");

const regexTitleContent = /const \[annTitle, setAnnTitle\] = useState\(""\);\s*const \[annContent, setAnnContent\] = useState\(""\);\s*const \[annVideoUrl, setAnnVideoUrl\] = useState\(""\);\s*const \[isUploadingAnn, setIsUploadingAnn\] = useState\(false\);\s*/m;
content = content.replace(regexTitleContent, "");

fs.writeFileSync(path, content, 'utf8');
