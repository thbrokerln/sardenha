/**
 * QA visual. Captura a pagina em varios viewports, percorrendo por scroll real
 * para disparar os ScrollTriggers.
 *
 * IMPORTANTE: Chrome headless reporta `prefers-reduced-motion: reduce` por
 * padrao. Sem emular "no-preference" voce acaba fotografando so a versao
 * estatica e achando que as animacoes quebraram.
 *
 *   node scripts/shoot.mjs [url] [outDir]
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.argv[2] ?? "http://localhost:5173";
const OUT = process.argv[3] ?? "qa";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844, dsf: 2, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2, mobile: true },
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2, mobile: false },
];

const SECTIONS = ["topo", "endereco", "bifurcacao", "janela", "empreendimento", "lazer", "unidades", "localizacao", "contato", "faq"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--force-color-profile=srgb", "--font-render-hinting=none", "--hide-scrollbars"],
});

await mkdir(OUT, { recursive: true });
const problems = [];

/** Percorre a pagina rolando de verdade e fotografa cada secao. */
async function pass({ vp, motion, prefix }) {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") problems.push(`[${prefix}] ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`[${prefix}] ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`[${prefix}] REQ ${r.url()} ${r.failure()?.errorText}`));

  await page.setViewport({
    width: vp.width, height: vp.height,
    deviceScaleFactor: vp.dsf, isMobile: vp.mobile, hasTouch: vp.mobile,
  });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: motion }]);
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(2400); // preloader + entrada do hero

  for (const id of SECTIONS) {
    const ok = await page.evaluate(async (sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return false;
      // usa o topo do pin-spacer quando a secao esta pinada
      const target = el.closest(".pin-spacer")?.offsetTop ?? el.offsetTop;
      const from = window.scrollY;
      for (let i = 1; i <= 24; i++) {
        window.scrollTo(0, from + ((target - from) * i) / 24);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      return true;
    }, id);
    if (!ok) continue;
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/${prefix}--${id}.png` });
  }

  // estado final util para o relatorio
  const state = await page.evaluate(() => ({
    counters: [...document.querySelectorAll("[data-count]")].map((e) => e.textContent),
    pinned: !!document.querySelector(".gallery__viewport.is-pinned"),
    docHeight: document.documentElement.scrollHeight,
  }));

  await page.close();
  return state;
}

for (const vp of VIEWPORTS) {
  const st = await pass({ vp, motion: "no-preference", prefix: vp.name });
  console.log(`${vp.name.padEnd(14)} contadores=${JSON.stringify(st.counters)} pin=${st.pinned}`);
}

// passe extra: confirma que o caminho de movimento reduzido entrega tudo legivel
const red = await pass({ vp: VIEWPORTS[2], motion: "reduce", prefix: "reduced-1440" });
console.log(`reduced-1440   contadores=${JSON.stringify(red.counters)} pin=${red.pinned}`);

await browser.close();

if (problems.length) {
  console.log("\nPROBLEMAS:\n" + [...new Set(problems)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nsem erros de console / rede");
}
