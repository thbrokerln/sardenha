/**
 * Testa o caminho de conversao: preenche o formulario, intercepta o
 * window.open e confere a URL do WhatsApp que seria aberta.
 *
 *   node scripts/test-form.mjs [url]
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TARGET = process.argv[2] ?? "http://localhost:4173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

// chega com UTMs, como viria de um anuncio
await p.goto(`${TARGET}?utm_source=meta&utm_campaign=sardenha_inv&fbclid=ABC123`, { waitUntil: "networkidle0" });
await sleep(2500);

await p.evaluate(() => {
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
});

// 1) botao flutuante do WhatsApp
const floatHref = await p.$eval("#waFloat", (el) => el.href);

// 2) um CTA com data-perfil deve pre-selecionar o objetivo
await p.evaluate(() => document.querySelector('[data-cta="fork-primeiro"]').click());
const perfilDepois = await p.$eval("#perfil", (el) => el.value);

// 3) validacao: envio vazio nao pode disparar nada
await p.evaluate(() => document.getElementById("leadForm").requestSubmit());
await sleep(300);
const aposVazio = await p.evaluate(() => window.__opened.length);
const erroVisivel = await p.$eval('[data-err-for="nome"]', (el) => !el.hidden);

// 4) preenchimento valido
await p.type("#nome", "Diego Alves");
await p.type("#whats", "12991661028");
await p.select("#unidade", "43m² — 1 suíte");
await p.evaluate(() => document.getElementById("leadForm").requestSubmit());
await sleep(600);

const res = await p.evaluate(() => ({
  aberto: window.__opened[0] ?? null,
  okVisivel: !document.getElementById("formOk").hidden,
}));

// 5) honeypot: escondido, fora do foco e invisivel para leitor de tela
const hp = await p.evaluate(() => {
  const input = document.getElementById("empresa");
  const box = input.closest(".hp");
  const r = box.getBoundingClientRect();
  return {
    existe: !!input,
    foraDaTela: r.right < 0 || r.left > innerWidth,
    semFoco: input.tabIndex === -1,
    ariaHidden: box.getAttribute("aria-hidden") === "true",
    naoEDisplayNone: getComputedStyle(box).display !== "none",
  };
});

// 6) a gravacao no Supabase precisa sair com headers e corpo corretos
const paraSupabase = [];
p.on("request", (r) => {
  if (!r.url().includes("supabase.co")) return;
  let corpo = null;
  try { corpo = JSON.parse(r.postData() ?? "null"); } catch { /* nao-JSON */ }
  paraSupabase.push({ url: r.url(), metodo: r.method(), headers: r.headers(), corpo });
});

await p.evaluate(() => { document.getElementById("nome").value = "Teste Dois"; });
await p.type("#whats", "12988887777");
await p.evaluate(() => document.getElementById("leadForm").requestSubmit());
await sleep(1200);

// 7) honeypot preenchido nao pode gravar no banco
const antes = paraSupabase.length;
await p.evaluate(() => {
  document.getElementById("nome").value = "Robo";
  document.getElementById("whats").value = "12988887777";
  document.getElementById("empresa").value = "spam-bot";
  document.getElementById("leadForm").requestSubmit();
});
await sleep(1000);
const depoisDoHoneypot = paraSupabase.length - antes;

await b.close();

const linha = (ok, txt) => console.log(`${ok ? "  ok " : "  XX "}${txt}`);

console.log("Fluxo de conversao\n");
linha(floatHref.startsWith("https://wa.me/5512991661028"), `botao flutuante -> ${floatHref.slice(0, 46)}...`);
linha(perfilDepois === "Primeiro imóvel — sair do aluguel", `CTA pre-seleciona objetivo -> "${perfilDepois}"`);
linha(aposVazio === 0, `envio vazio nao abre WhatsApp (aberturas: ${aposVazio})`);
linha(erroVisivel, "envio vazio mostra erro de validacao");

const u = res.aberto ? new URL(res.aberto) : null;
const texto = u ? decodeURIComponent(u.searchParams.get("text") ?? "") : "";
linha(!!u && u.pathname === "/5512991661028", `envio valido abre wa.me/5512991661028`);
linha(texto.includes("Diego Alves"), "mensagem leva o nome");
linha(texto.includes("43m²"), "mensagem leva a unidade escolhida");
linha(texto.includes("Primeiro imóvel"), "mensagem leva o objetivo");
linha(res.okVisivel, "confirmacao aparece na tela");

console.log("\nAnti-spam / integracao\n");
linha(hp.existe && hp.foraDaTela, "honeypot existe e esta fora da tela");
linha(hp.semFoco, "honeypot fora da ordem de foco (tabindex -1)");
linha(hp.ariaHidden, "honeypot invisivel para leitor de tela");
linha(hp.naoEDisplayNone, "honeypot nao usa display:none (robo ignoraria)");
linha(depoisDoHoneypot === 0, `honeypot preenchido nao grava no banco (${depoisDoHoneypot} req)`);

console.log("\nGravacao no Supabase\n");
const req = paraSupabase[0];
if (!req) {
  console.log("  XX nenhuma requisicao saiu — anonKey configurada?");
} else {
  linha(req.metodo === "POST" && req.url.endsWith("/rest/v1/leads"), `POST /rest/v1/leads`);
  linha(!!req.headers.apikey, "header apikey presente");
  linha((req.headers.authorization ?? "").startsWith("Bearer "), "header Authorization presente");
  linha(req.headers.prefer === "return=minimal", "Prefer: return=minimal (anon nao pode ler de volta)");
  linha(req.corpo?.projeto === "sardenha", `projeto = "${req.corpo?.projeto}"`);
  linha(req.corpo?.nome === "Teste Dois", `nome = "${req.corpo?.nome}"`);
  linha(req.corpo?.utm_source === "meta", `utm_source = "${req.corpo?.utm_source}"`);
  linha(req.corpo?.utm_campaign === "sardenha_inv", `utm_campaign = "${req.corpo?.utm_campaign}"`);
  linha(req.corpo?.fbclid === "ABC123", `fbclid = "${req.corpo?.fbclid}"`);
  linha(!("empresa" in (req.corpo ?? {})), "honeypot nao vaza para o banco");
}

console.log("\n  --- mensagem que chega no seu WhatsApp ---");
console.log(texto.split("\n").map((l) => "  | " + l).join("\n"));
