/** Despeja a pagina na ordem de leitura, secao por secao, para analise de funil. */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(process.argv[2] ?? "https://sardenha.thimoveiscaragua.com/", { waitUntil: "networkidle0" });
await sleep(3000);
await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
await sleep(300);

const secoes = await p.evaluate(() =>
  [...document.querySelectorAll("section[id], footer")].map((s) => ({
    id: s.id || "footer",
    txt: s.innerText.replace(/\n{3,}/g, "\n\n").trim(),
    ctas: [...s.querySelectorAll("a.btn, button.btn, a.fork__card")].map((a) => a.innerText.trim().split("\n")[0]),
  }))
);

for (const s of secoes) {
  console.log(`\n${"=".repeat(64)}\n[ ${s.id.toUpperCase()} ]\n${"=".repeat(64)}`);
  console.log(s.txt);
  if (s.ctas.length) console.log(`\n  >> CTAs: ${s.ctas.join(" | ")}`);
}
await b.close();
