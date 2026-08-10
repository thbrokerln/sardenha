import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(process.argv[2] ?? "http://localhost:4173/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2600));
for (const t of ["studio", "apto"]) {
  await p.evaluate((x) => document.querySelector(`[data-tipo="${x}"]`).click(), t);
  await new Promise((r) => setTimeout(r, 400));
  console.log(`  ${t}: ${await p.$eval('[data-slot="urgencia"]', (e) => e.innerText)}`);
}
console.log(`\n  contato: ${await p.$eval("#contato .lead", (e) => e.innerText)}`);
await b.close();
