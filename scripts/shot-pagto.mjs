/** Screenshot e conferencia do bloco de condicoes de pagamento. */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });

const ler = (pg) =>
  pg.evaluate(() => {
    const g = (s) => document.querySelector(`[data-slot="${s}"]`)?.textContent;
    return {
      tipo: document.querySelector(".pagto__tab.is-on")?.dataset.tipo,
      entradaDoAto: g("entradaDoAto"), parcelaEntrada: g("parcelaEntrada"),
      entradaTotal: g("entradaTotal"), mensaisRestantes: g("mensaisRestantes"),
      mensal: g("mensal"), anuaisRestantes: g("anuaisRestantes"), anual: g("anual"),
      total: g("total"), entrega: g("rotuloEntrega"), meses: g("mesesAteEntrega"),
      renda: g("rendaSugerida"), sobreposta: g("mensalSobreposta"),
      ctaUnidade: document.querySelector(".pagto__cta")?.dataset.unidade,
    };
  });

for (const [nome, w, h, dsf] of [["desktop", 1440, 900, 2], ["mobile", 390, 844, 2]]) {
  const pg = await b.newPage();
  await pg.setViewport({ width: w, height: h, deviceScaleFactor: dsf, isMobile: w < 700, hasTouch: w < 700 });
  await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await pg.goto("http://localhost:4173/", { waitUntil: "networkidle0" });
  await sleep(2600);
  await pg.evaluate(() => document.getElementById("pagamento").scrollIntoView());
  await sleep(1500);
  await pg.screenshot({ path: `qa/pagto-${nome}-studio.png` });
  console.log(`\n[${nome}] studio:`, JSON.stringify(await ler(pg), null, 1));

  await pg.evaluate(() => document.querySelector('[data-tipo="apto"]').click());
  await sleep(600);
  await pg.screenshot({ path: `qa/pagto-${nome}-apto.png` });
  console.log(`[${nome}] apto:`, JSON.stringify(await ler(pg), null, 1));
  await pg.close();
}
await b.close();
