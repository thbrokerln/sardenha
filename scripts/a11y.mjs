/**
 * Auditoria de contraste WCAG 2.1 AA sobre a pagina renderizada de verdade.
 * Mede a cor computada de cada elemento com texto e o fundo efetivo (subindo
 * a arvore ate achar uma cor opaca), e aplica o limiar certo por tamanho.
 *
 *   node scripts/a11y.mjs [url]
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.argv[2] ?? "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await page.goto(URL, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
await sleep(2500);

// abre todos os <details> para o texto das respostas entrar na auditoria
await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
await sleep(400);

const findings = await page.evaluate(() => {
  const parse = (c) => {
    const m = c.match(/[\d.]+/g);
    return m ? m.map(Number) : null;
  };
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const over = (fg, bg) => {
    const a = fg[3] ?? 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };

  // fundo efetivo: sobe ate encontrar algo opaco
  const bgOf = (el) => {
    let node = el;
    const stack = [];
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && (c[3] ?? 1) > 0) {
        stack.push(c);
        if ((c[3] ?? 1) === 1) break;
      }
      node = node.parentElement;
    }
    let base = [253, 250, 245];
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!direct) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // texto sobre imagem nao da para medir de forma confiavel — reporta a parte
    const onImage = !!el.closest(".hero__body");

    const fg = parse(cs.color);
    if (!fg) return;
    const bg = bgOf(el);
    const color = over(fg, bg);
    const cr = ratio(color, bg);

    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const min = large ? 3 : 4.5;

    if (cr < min) {
      out.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""),
        text: el.textContent.trim().slice(0, 46),
        ratio: +cr.toFixed(2),
        min,
        size: Math.round(size),
        onImage,
      });
    }
  });
  return out;
});

await browser.close();

const real = findings.filter((f) => !f.onImage);
const overImage = findings.filter((f) => f.onImage);

if (real.length === 0) {
  console.log("CONTRASTE AA: sem falhas em texto sobre fundo solido");
} else {
  console.log(`CONTRASTE AA: ${real.length} falha(s)\n`);
  for (const f of real) console.log(`  ${f.ratio} (min ${f.min}) ${f.size}px  ${f.sel}\n      "${f.text}"`);
}
if (overImage.length) {
  console.log(`\n${overImage.length} elemento(s) sobre a imagem do hero — medida nao confiavel, conferir a olho:`);
  for (const f of overImage) console.log(`  ${f.sel} "${f.text}"`);
}
process.exitCode = real.length ? 1 : 0;
