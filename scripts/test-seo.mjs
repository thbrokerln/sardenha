/** Valida os dados estruturados e os sinais de SEO da pagina renderizada. */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALVO = process.argv[2] ?? "http://localhost:4173/";

let falhas = 0;
const ok = (c, t, d = "") => { if (!c) falhas++; console.log(`  ${c ? "ok " : "XX "}${t}${d ? `\n        ${d}` : ""}`); };

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(ALVO, { waitUntil: "networkidle0" });
await sleep(2600);

const dados = await p.evaluate(() => {
  const el = document.querySelector('script[type="application/ld+json"]');
  const meta = (n, attr = "name") =>
    document.querySelector(`meta[${attr}="${n}"]`)?.getAttribute("content");
  return {
    ld: el?.textContent ?? null,
    title: document.title,
    description: meta("description"),
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogTitle: meta("og:title", "property"),
    ogImage: meta("og:image", "property"),
    ogUrl: meta("og:url", "property"),
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
    h2: document.querySelectorAll("h2").length,
    imgsSemAlt: [...document.querySelectorAll("img")].filter((i) => !i.alt?.trim()).length,
    imgsTotal: document.querySelectorAll("img").length,
  };
});

console.log("Metadados\n");
ok(!!dados.title && dados.title.length <= 65, `title (${dados.title?.length} car.)`, dados.title);
ok(!!dados.description && dados.description.length <= 165,
   `description (${dados.description?.length} car.)`,
   dados.description?.length > 165 ? "acima de 165 — o Google corta" : "");
ok(dados.lang === "pt-BR", `lang = ${dados.lang}`);
ok(!!dados.canonical, `canonical = ${dados.canonical}`);
ok(!!dados.ogImage?.startsWith("http"), `og:image absoluto = ${dados.ogImage}`);
ok(!!dados.ogUrl, `og:url = ${dados.ogUrl}`);
ok(dados.h1.length === 1, `exatamente 1 <h1> (achei ${dados.h1.length})`, dados.h1[0]);
ok(dados.h2 > 0, `${dados.h2} <h2> de secao`);
ok(dados.imgsSemAlt === 0, `todas as ${dados.imgsTotal} imagens com alt (${dados.imgsSemAlt} sem)`);

console.log("\nDados estruturados (JSON-LD)\n");
ok(!!dados.ld, "script application/ld+json presente");
if (dados.ld) {
  let j = null;
  try { j = JSON.parse(dados.ld); } catch (e) { ok(false, "JSON valido", e.message); }
  if (j) {
    ok(true, "JSON valido");
    const grafo = j["@graph"] ?? [];
    const tipos = grafo.map((n) => n["@type"]);
    ok(tipos.includes("ApartmentComplex"), `tipos: ${tipos.join(", ")}`);
    ok(tipos.includes("FAQPage"), "FAQPage presente (habilita resultado rico)");

    const emp = grafo.find((n) => n["@type"] === "ApartmentComplex");
    ok(!!emp?.address?.addressLocality, `endereco: ${emp?.address?.addressLocality}/${emp?.address?.addressRegion}`);
    ok(!!emp?.geo?.latitude, `geo: ${emp?.geo?.latitude}, ${emp?.geo?.longitude}`);
    ok((emp?.makesOffer ?? []).length >= 2, `${emp?.makesOffer?.length} ofertas com preco`);
    for (const o of emp?.makesOffer ?? []) {
      ok(typeof o.price === "number" && o.price > 0 && o.priceCurrency === "BRL",
         `oferta ${o.name?.slice(0, 22)}… -> ${o.priceCurrency} ${o.price}`);
    }
    ok((emp?.amenityFeature ?? []).length >= 10, `${emp?.amenityFeature?.length} itens de lazer descritos`);

    const faq = grafo.find((n) => n["@type"] === "FAQPage");
    ok((faq?.mainEntity ?? []).length >= 5, `${faq?.mainEntity?.length} perguntas no FAQ`);
    const semResposta = (faq?.mainEntity ?? []).filter((q) => !q.acceptedAnswer?.text?.trim()).length;
    ok(semResposta === 0, `todas as perguntas com resposta (${semResposta} sem)`);
  }
}

// arquivos que os rastreadores procuram
console.log("\nArquivos para rastreador\n");
for (const [arquivo, esperado] of [["/robots.txt", "Sitemap:"], ["/sitemap.xml", "<urlset"], ["/llms.txt", "# Residencial Sardenha"]]) {
  const r = await p.goto(new URL(arquivo, ALVO).href);
  const txt = await r.text();
  ok(r.status() === 200 && txt.includes(esperado), `${arquivo} (HTTP ${r.status()})`);
}

await b.close();
console.log(falhas === 0 ? "\nSEO ok.\n" : `\n${falhas} problema(s).\n`);
process.exitCode = falhas ? 1 : 0;
