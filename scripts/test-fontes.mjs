/**
 * Verifica se o subset das fontes cobre TODO texto que a pagina renderiza,
 * inclusive o que so existe depois do JS rodar (precos, meses, contadores).
 *
 * Sem isso, um caractere fora do subset vira quadradinho — e so alguem
 * olhando a tela no dia certo perceberia.
 */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = process.argv[2] ?? "http://localhost:4173/";

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(URL, { waitUntil: "networkidle0" });
await sleep(2600);

// exercita os estados que trocam texto: abas de tipologia e FAQ aberto
await p.evaluate(() => {
  document.querySelectorAll("details").forEach((d) => (d.open = true));
});
const textos = new Set();
const capturar = async () => {
  const t = await p.evaluate(() => document.body.innerText);
  for (const c of t) textos.add(c);
};
await capturar();
for (const tipo of ["apto", "studio"]) {
  await p.evaluate((t) => document.querySelector(`[data-tipo="${t}"]`)?.click(), tipo);
  await sleep(400);
  await capturar();
}

// pergunta ao proprio navegador quais caracteres a fonte consegue desenhar
const faltando = await p.evaluate(async (chars) => {
  await document.fonts.ready;
  const ausentes = { Fraunces: [], Manrope: [] };
  for (const familia of ["Fraunces", "Manrope"]) {
    for (const c of chars) {
      if (/\s/.test(c)) continue;
      if (!document.fonts.check(`16px "${familia}"`, c)) ausentes[familia].push(c);
    }
  }
  return ausentes;
}, [...textos]);

await b.close();

let falhas = 0;
for (const [familia, lista] of Object.entries(faltando)) {
  if (lista.length) {
    falhas += lista.length;
    console.log(`  XX ${familia}: ${lista.length} caractere(s) sem glifo -> ${lista.join("")}`);
    console.log(`     acrescente em EXTRA (scripts/subset_fonts.py) e rode o subset de novo`);
  } else {
    console.log(`  ok ${familia}: cobre todos os ${textos.size} caracteres da pagina`);
  }
}
process.exitCode = falhas ? 1 : 0;
