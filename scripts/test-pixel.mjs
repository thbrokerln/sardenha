/**
 * Confere que o Pixel do Meta carrega e dispara os eventos certos:
 * PageView na carga, Lead no envio do formulario, Contact no WhatsApp.
 *
 * Intercepta as chamadas para facebook.com/tr, que sao os "beacons" do pixel —
 * cada evento vira um GET com ?ev=<Evento>&id=<PixelId>.
 */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALVO = process.argv[2] ?? "http://localhost:4173/";
const PIXEL = "1715820572780570";

let falhas = 0;
const ok = (c, t) => { if (!c) falhas++; console.log(`  ${c ? "ok " : "XX "}${t}`); };

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();

const eventos = [];
p.on("request", (r) => {
  const u = r.url();
  if (u.includes("facebook.com/tr")) {
    const q = new URLSearchParams(u.split("?")[1] ?? "");
    eventos.push({ ev: q.get("ev"), id: q.get("id") });
  }
});

await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(ALVO, { waitUntil: "networkidle0" });
await sleep(2500);

// impede a aba do WhatsApp de abrir de verdade durante o teste
await p.evaluate(() => { window.open = () => null; });

// PageView deve ter saido na carga
ok(eventos.some((e) => e.ev === "PageView" && e.id === PIXEL), "PageView disparado na carga");

// clica no WhatsApp flutuante -> Contact
await p.evaluate(() => document.getElementById("waFloat").click());
await sleep(600);
ok(eventos.some((e) => e.ev === "Contact"), "Contact disparado no WhatsApp");

// preenche e envia o formulario -> Lead
await p.type("#nome", "Teste Pixel");
await p.type("#whats", "12991661028");
await p.evaluate(() => document.getElementById("leadForm").requestSubmit());
await sleep(800);
ok(eventos.some((e) => e.ev === "Lead"), "Lead disparado no envio do formulario");

console.log(`\n  eventos capturados: ${eventos.map((e) => e.ev).join(", ") || "(nenhum)"}`);
ok(eventos.every((e) => e.id === PIXEL), `todos no pixel ${PIXEL}`);

await b.close();
console.log(falhas === 0 ? "\nPixel ok.\n" : `\n${falhas} problema(s).\n`);
process.exitCode = falhas ? 1 : 0;
