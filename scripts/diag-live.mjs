import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text()); });
p.on("requestfailed", (r) => console.log("REQFAIL:", r.url(), r.failure()?.errorText));
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(process.argv[2], { waitUntil: "networkidle0" });
await sleep(3000);
console.log(await p.evaluate(() => JSON.stringify({
  ldPresente: !!document.querySelector('script[type="application/ld+json"]'),
  scriptsNoHead: [...document.head.querySelectorAll("script")].map((s) => s.type || s.src.split("/").pop()),
  bundle: [...document.querySelectorAll("script[src]")].map((s) => s.src.split("/").pop()),
  temPagamento: !!document.getElementById("pagamento"),
  slotPreenchido: document.querySelector('[data-slot="entradaDoAto"]')?.textContent,
}, null, 1)));
await b.close();
