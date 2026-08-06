import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();

p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => console.log(`console.${m.type()}:`, m.text()));
p.on("requestfailed", (r) => console.log("REQFAIL:", r.url(), r.failure()?.errorText));

await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
// headless reporta "reduce" por padrao — precisa emular usuario normal
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5173", { waitUntil: "networkidle0" });
await sleep(3000);

console.log("reduzido?", await p.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches));
console.log("== estado ==");
console.log(await p.evaluate(() => JSON.stringify({
  fine: matchMedia("(min-width: 861px) and (pointer: fine)").matches,
  pinned: !!document.querySelector(".gallery__viewport.is-pinned"),
  spacers: document.querySelectorAll(".pin-spacer").length,
  counters: [...document.querySelectorAll("[data-count]")].map((e) => e.textContent),
  cursorEl: !!document.querySelector(".cursor"),
  stickyBound: !!document.getElementById("stickyCta"),
  gsapTriggers: window.ScrollTrigger ? "exposto" : "nao exposto",
}, null, 1)));

// quantos ScrollTriggers existem? (via gsap global do modulo, se acessivel)
console.log(await p.evaluate(() => {
  const el = document.querySelector("[data-gallery]");
  const track = document.querySelector("[data-gallery-track]");
  return JSON.stringify({
    viewportFound: !!el,
    trackFound: !!track,
    trackScrollW: track?.scrollWidth,
    viewportClientW: el?.clientWidth,
    trackTransform: track ? getComputedStyle(track).transform : null,
  }, null, 1);
}));

await b.close();
