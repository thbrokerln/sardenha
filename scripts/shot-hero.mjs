/**
 * Captura o hero em varios instantes da animacao e reporta o transform
 * aplicado, para conferir que o push tem direcao (nao e zoom centrado).
 */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(process.argv[2] ?? "http://localhost:4173/", { waitUntil: "networkidle0" });
await sleep(2400); // preloader + entrada

const estado = () =>
  p.evaluate(() => {
    const img = document.querySelector(".hero__media img");
    const cs = getComputedStyle(img);
    const m = new DOMMatrixReadOnly(cs.transform);
    return {
      escala: +m.a.toFixed(4),
      deslocX: +m.e.toFixed(1),
      deslocY: +m.f.toFixed(1),
      origem: cs.transformOrigin,
    };
  });

console.log("instante  escala   deslocX  deslocY");
for (const s of [0, 4, 8, 13, 19]) {
  if (s > 0) await sleep(s === 4 ? 4000 : 4000 + (s === 13 ? 1000 : 0) + (s === 19 ? 2000 : 0));
  const e = await estado();
  console.log(`  ~${String(s).padStart(2)}s   ${e.escala}   ${String(e.deslocX).padStart(6)}  ${String(e.deslocY).padStart(6)}`);
  await p.screenshot({ path: `qa/hero-t${String(s).padStart(2, "0")}.png` });
}
console.log("\norigem do transform:", (await estado()).origem);
await b.close();
