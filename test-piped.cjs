const instances = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.in.projectsegfau.lt",
  "https://piped-api.garudalinux.org",
  "https://pipedapi.lunar.icu",
  "https://piped-api.privacydev.net"
];
async function run() {
  for (const url of instances) {
     try {
         const res = await fetch(url + "/trending?region=ES");
         if (res.ok) {
             const data = await res.json();
             console.log("Success on", url);
             data.slice(0, 5).forEach((v, i) => console.log(`${i+1}. ${v.title} (${v.uploaderName})`));
             return;
         }
     } catch(e) {}
  }
  console.log("All failed");
}
run();
