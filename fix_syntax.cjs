const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

// I will just append a </div> if missing
// Let's count <div> and </div>
let divCount = (code.match(/<div/g) || []).length;
let endDivCount = (code.match(/<\/div>/g) || []).length;

console.log("div count:", divCount, "end div count:", endDivCount);

if (divCount > endDivCount) {
    const diff = divCount - endDivCount;
    let ends = "";
    for (let i = 0; i < diff; i++) {
        ends += "</div>\n";
    }
    code = code.replace(/  \);\n};\n?$/, ends + "  );\n};\n");
    fs.writeFileSync('src/components/VideoView.tsx', code);
    console.log("Appended missing </div> tags");
} else if (endDivCount > divCount) {
    const diff = endDivCount - divCount;
    let regexStr = "";
    for (let i = 0; i < diff; i++) {
        regexStr += "<\/div>\\s*";
    }
    code = code.replace(new RegExp(regexStr + "  \\);\\n};\\n?$"), "  );\n};\n");
    fs.writeFileSync('src/components/VideoView.tsx', code);
    console.log("Removed extra </div> tags");
}

