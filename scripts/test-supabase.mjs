/**
 * Valida a integracao de leads contra o Supabase de verdade.
 *
 * Nao testa so o caminho feliz: confirma que a chave publica NAO consegue ler,
 * editar nem apagar lead — que e a propriedade de seguranca que importa.
 * Se a RLS estiver errada, qualquer visitante baixa sua base de leads inteira.
 *
 *   node scripts/test-supabase.mjs
 *
 * Le url/projeto de src/config.ts. A chave anon vem do config ou de SUPABASE_ANON_KEY.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = readFileSync(join(root, "src/config.ts"), "utf8");

const pick = (key) => (cfg.match(new RegExp(`${key}:\\s*"([^"]*)"`)) ?? [])[1] ?? "";
const url = pick("url");
const projeto = pick("projeto");
const anonKey = process.env.SUPABASE_ANON_KEY || pick("anonKey");

if (!url || !anonKey) {
  console.error("Faltou configurar. Cole a chave `anon public` em src/config.ts,");
  console.error("ou rode:  SUPABASE_ANON_KEY=... node scripts/test-supabase.mjs");
  process.exit(1);
}

const H = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "Content-Type": "application/json",
};

const ok = (b, t) => console.log(`${b ? "  ok " : "  XX "}${t}`);
let falhas = 0;
const check = (b, t) => { if (!b) falhas++; ok(b, t); };

console.log(`Supabase: ${url}`);
console.log(`Projeto:  ${projeto}\n`);

// 1) inserir um lead de teste — e o que a landing faz
const marcador = `TESTE-${Date.now()}`;
const insert = await fetch(`${url}/rest/v1/leads`, {
  method: "POST",
  headers: { ...H, Prefer: "return=minimal" },
  body: JSON.stringify({
    projeto,
    nome: marcador,
    whatsapp: "12991661028",
    objetivo: "Teste automatizado",
    unidade: "43m² — 1 suíte",
    utm_source: "script-de-teste",
    pagina: "/teste",
  }),
});
if (!insert.ok) {
  const corpo = await insert.text();
  console.log(`  XX insere lead (HTTP ${insert.status})`);
  console.log("      resposta:", corpo.slice(0, 300));
  // Sem tabela, TODA requisicao seguinte devolve 404 e as checagens de
  // seguranca passariam por engano. Aborta em vez de mostrar verde falso.
  if (corpo.includes("PGRST205") || insert.status === 404) {
    console.log("\n  A tabela public.leads nao existe — a migration nao foi aplicada.");
    console.log("  Rode:  supabase db push");
    console.log("  ou cole supabase/migrations/20260806120000_leads.sql no SQL Editor.");
    console.log("\n  As checagens de RLS nao foram executadas (nao daria para confiar nelas).");
    process.exit(1);
  }
  falhas++;
} else {
  ok(true, `insere lead (HTTP ${insert.status})`);
}

// Confere o MOTIVO da recusa, nao so o status. Um 404 por tabela faltando
// tambem "nao e ok" — e passaria como se a seguranca estivesse validada.
const corpoDe = async (res) => {
  try { return JSON.parse(await res.text()); } catch { return {}; }
};

// 2) a chave publica NAO pode ler os leads — nem contar
for (const q of ["select=*&limit=5", "select=count"]) {
  const read = await fetch(`${url}/rest/v1/leads?${q}`, { headers: H });
  const body = await corpoDe(read);
  const negado = !read.ok && body.code === "42501";
  check(negado, `nao le leads (${q}) — HTTP ${read.status} ${body.code ?? ""}`);
  if (read.ok) console.log("      !! RLS ABERTA: qualquer visitante baixa sua base de leads.");
}

// 3) nao pode apagar
const del = await fetch(`${url}/rest/v1/leads?nome=eq.${marcador}`, { method: "DELETE", headers: H });
const delBody = await corpoDe(del);
check(!del.ok && delBody.code === "42501", `nao apaga lead — HTTP ${del.status} ${delBody.code ?? ""}`);

// 4) dados invalidos tem que bater na RLS (42501), nao passar por acaso
const invalidos = [
  ["slug de projeto inexistente", { projeto: "nao-existe", nome: "Fulano Teste", whatsapp: "12991661028" }],
  ["nome curto demais", { projeto, nome: "A", whatsapp: "12991661028" }],
  ["whatsapp curto demais", { projeto, nome: "Fulano Teste", whatsapp: "123" }],
  // impede que alguem injete lead ja marcado como fechado e suje o funil
  ["status forjado", { projeto, nome: "Fulano Teste", whatsapp: "12991661028", status: "fechado" }],
];
for (const [rotulo, body] of invalidos) {
  const res = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  const b = await corpoDe(res);
  check(!res.ok && b.code === "42501", `recusa ${rotulo} — HTTP ${res.status} ${b.code ?? ""}`);
}

console.log(
  falhas === 0
    ? `\nTudo certo. Apague o lead "${marcador}" pelo painel do Supabase.`
    : `\n${falhas} verificacao(oes) falharam — nao publique antes de resolver.`
);
process.exitCode = falhas ? 1 : 0;
