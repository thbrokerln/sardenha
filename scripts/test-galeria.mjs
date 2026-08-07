/** Confere em que tamanhos o scroll horizontal fixado da galeria de lazer engata. */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = process.argv[2] ?? "http://localhost:4173/";

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });

const casos = [
  ["celular 390", 390, 844, true, false],
  ["tablet 768", 768, 1024, true, false],
  ["notebook touch 1024", 1024, 768, false, true],
  ["desktop 1440", 1440, 900, false, false],
];

console.log("tamanho              pin     spacer  dica");
for (const [rot, w, h, mobile, touch] of casos) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile || touch });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(URL, { waitUntil: "networkidle0" });
  await sleep(2600);
  const r = await p.evaluate(() => {
    const vp = document.querySelector("[data-gallery]");
    return {
      pin: vp?.classList.contains("is-pinned"),
      spacers: document.querySelectorAll(".pin-spacer").length,
      dica: document.querySelector("[data-gallery-hint]")?.textContent,
      rolavel: vp ? vp.scrollWidth > vp.clientWidth : false,
    };
  });
  console.log(
    `${rot.padEnd(20)} ${String(r.pin).padEnd(7)} ${String(r.spacers).padEnd(7)} ${r.dica}` +
    (r.pin || r.rolavel ? "" : "   <-- NAO ROLA HORIZONTALMENTE")
  );
  await p.close();
}
await b.close();
