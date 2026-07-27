const fs = require('fs');
const file1 = 'src/components/FAIView.tsx';
let code1 = fs.readFileSync(file1, 'utf8');

const target1 = `  const [topRatio, setTopRatio] = useState(() => {
    const saved = localStorage.getItem("fai_top_ratio");
    return saved !== null ? parseInt(saved, 10) : 40;
  });
  const [favRatio, setFavRatio] = useState(() => {
    const saved = localStorage.getItem("fai_fav_ratio");
    return saved !== null ? parseInt(saved, 10) : 20;
  });
  const [discRatio, setDiscRatio] = useState(() => {
    const saved = localStorage.getItem("fai_disc_ratio");
    return saved !== null ? parseInt(saved, 10) : 40;
  });`;

const replacement1 = `  const [topRatio, setTopRatio] = useState(() => {
    const saved = localStorage.getItem("fai_top_ratio");
    if (saved === "32" || saved === "40") return 60; // Migrate old defaults
    return saved !== null ? parseInt(saved, 10) : 60;
  });
  const [favRatio, setFavRatio] = useState(() => {
    const saved = localStorage.getItem("fai_fav_ratio");
    if (saved === "18" || saved === "20") return 25; // Migrate old defaults
    return saved !== null ? parseInt(saved, 10) : 25;
  });
  const [discRatio, setDiscRatio] = useState(() => {
    const saved = localStorage.getItem("fai_disc_ratio");
    if (saved === "50" || saved === "40") return 15; // Migrate old defaults
    return saved !== null ? parseInt(saved, 10) : 15;
  });`;

if (code1.includes(target1)) {
  code1 = code1.replace(target1, replacement1);
  fs.writeFileSync(file1, code1);
  console.log("Patched FAIView.tsx ratios successfully");
} else {
  console.log("Target FAIView.tsx ratios not found!");
}

const file2 = 'src/lib/djLogic.ts';
let code2 = fs.readFileSync(file2, 'utf8');

const target2 = `  // Determine user parameters with strict fallback to default (40, 20, 40)
  let topRatio = 40;
  let favRatio = 20;
  let discRatio = 40;`;

const replacement2 = `  // Determine user parameters with strict fallback to industry standard defaults (60, 25, 15)
  let topRatio = 60;
  let favRatio = 25;
  let discRatio = 15;`;

if (code2.includes(target2)) {
  code2 = code2.replace(target2, replacement2);
  fs.writeFileSync(file2, code2);
  console.log("Patched djLogic.ts defaults successfully");
} else {
  console.log("Target djLogic.ts defaults not found!");
}

const target3 = `      const savedTop = window.localStorage.getItem("fai_top_ratio");
      const savedFav = window.localStorage.getItem("fai_fav_ratio");
      const savedDisc = window.localStorage.getItem("fai_disc_ratio");
      if (savedTop !== null) topRatio = parseInt(savedTop, 10);
      if (savedFav !== null) favRatio = parseInt(savedFav, 10);
      if (savedDisc !== null) discRatio = parseInt(savedDisc, 10);`;

const replacement3 = `      const savedTop = window.localStorage.getItem("fai_top_ratio");
      const savedFav = window.localStorage.getItem("fai_fav_ratio");
      const savedDisc = window.localStorage.getItem("fai_disc_ratio");
      if (savedTop !== null) {
        if (savedTop === "32" || savedTop === "40") topRatio = 60;
        else topRatio = parseInt(savedTop, 10);
      }
      if (savedFav !== null) {
        if (savedFav === "18" || savedFav === "20") favRatio = 25;
        else favRatio = parseInt(savedFav, 10);
      }
      if (savedDisc !== null) {
        if (savedDisc === "50" || savedDisc === "40") discRatio = 15;
        else discRatio = parseInt(savedDisc, 10);
      }`;

if (code2.includes(target3)) {
  code2 = code2.replace(target3, replacement3);
  fs.writeFileSync(file2, code2);
  console.log("Patched djLogic.ts localstorage read successfully");
} else {
  console.log("Target djLogic.ts localstorage read not found!");
}

const target4 = `  const wTop = total > 0 ? topRatio / total : 0.40;
  const wFav = total > 0 ? favRatio / total : 0.20;
  const wDisc = total > 0 ? discRatio / total : 0.40;`;

const replacement4 = `  const wTop = total > 0 ? topRatio / total : 0.60;
  const wFav = total > 0 ? favRatio / total : 0.25;
  const wDisc = total > 0 ? discRatio / total : 0.15;`;

if (code2.includes(target4)) {
  code2 = code2.replace(target4, replacement4);
  fs.writeFileSync(file2, code2);
  console.log("Patched djLogic.ts wRatios successfully");
} else {
  console.log("Target djLogic.ts wRatios not found!");
}

