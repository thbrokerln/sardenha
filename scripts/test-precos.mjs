/**
 * Trava as contas do bloco de condicoes de pagamento.
 *
 * Aqui um bug nao desalinha layout: publica PRECO ERRADO. Por isso o teste
 * verifica os valores contra o espelho da incorporadora, e nao a aparencia.
 *
 *   node --experimental-strip-types scripts/test-precos.mjs
 */
import { calcular } from "../src/modules/precos.ts";
import { CRONOGRAMA, TIPOLOGIAS } from "../src/precos.ts";

let falhas = 0;
const brl = (v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ok(cond, titulo, detalhe = "") {
  if (!cond) falhas++;
  console.log(`  ${cond ? "ok " : "XX "}${titulo}${detalhe ? `\n        ${detalhe}` : ""}`);
}
const perto = (a, b, tol = 0.10) => Math.abs(a - b) <= tol;

/* ------------------------------------------------------------------------ */
console.log("\n1. Soma de todas as parcelas = total do espelho");
for (const id of Object.keys(TIPOLOGIAS)) {
  const t = TIPOLOGIAS[id];
  const c = calcular(id, new Date(2026, 7, 6)); // 06/08/2026
  const soma = c.entradaTotal + c.mensaisRestantes * t.mensal + c.anuaisRestantes * t.anual;
  ok(perto(soma, t.total), `${t.rotulo}: ${brl(soma)} = ${brl(t.total)}`,
     perto(soma, t.total) ? "" : `diferenca de ${brl(soma - t.total)}`);
}

/* ------------------------------------------------------------------------ */
console.log("\n2. Obra fecha com o R$/m² do espelho (R$ 4.300/m²)");
for (const id of Object.keys(TIPOLOGIAS)) {
  const t = TIPOLOGIAS[id];
  const obra = CRONOGRAMA.totalMensais * t.mensal + CRONOGRAMA.anosAnuais.length * t.anual;
  const esperado = t.area * 4300;
  ok(perto(obra, esperado), `${t.rotulo}: ${brl(obra)} = ${t.area} x 4.300`);
}

/* ------------------------------------------------------------------------ */
console.log("\n3. Entrada = fracao + 1a anual, diluida em 6x");
for (const id of Object.keys(TIPOLOGIAS)) {
  const t = TIPOLOGIAS[id];
  const c = calcular(id, new Date(2026, 7, 6));
  ok(perto(c.parcelaEntrada * CRONOGRAMA.parcelasEntrada, t.fracao + t.anual),
     `${t.rotulo}: 6 x ${brl(c.parcelaEntrada)} = ${brl(t.fracao + t.anual)}`);
  ok(perto(c.entradaDoAto, c.parcelaEntrada + c.obraAcumulada),
     `${t.rotulo}: ato ${brl(c.entradaDoAto)} = 1/6 + obra acumulada`);
}

/* ------------------------------------------------------------------------ */
console.log("\n4. Virada do dia 25");
const dia24 = calcular("studio", new Date(2026, 7, 24));
const dia25 = calcular("studio", new Date(2026, 7, 25));
const dia26 = calcular("studio", new Date(2026, 7, 26));
ok(dia24.mensaisVencidas === 8, `dia 24/08 -> ${dia24.mensaisVencidas} vencidas (esperado 8)`);
ok(dia25.mensaisVencidas === 9, `dia 25/08 -> ${dia25.mensaisVencidas} vencidas (esperado 9, ja virou)`);
ok(dia25.mensaisVencidas === dia26.mensaisVencidas, "dias 25 e 26 contam igual");
ok(dia24.entradaDoAto < dia25.entradaDoAto, "entrada do ato sobe apos a virada");

/* ------------------------------------------------------------------------ */
console.log("\n5. Linha do tempo, sem estourar as pontas");
const casos = [
  [new Date(2026, 0, 6), 1, 47, "inicio (jan/2026)"],
  [new Date(2026, 7, 6), 8, 40, "hoje (ago/2026)"],
  [new Date(2029, 11, 6), 48, 0, "ultima mensal (dez/2029)"],
  [new Date(2030, 5, 6), 48, 0, "depois do fim (jun/2030)"],
  [new Date(2031, 0, 6), 48, 0, "muito depois (jan/2031)"],
];
for (const [data, venc, rest, rot] of casos) {
  const c = calcular("studio", data);
  ok(c.mensaisVencidas === venc && c.mensaisRestantes === rest,
     `${rot}: ${c.mensaisVencidas} vencidas / ${c.mensaisRestantes} restantes`);
}

/* ------------------------------------------------------------------------ */
console.log("\n6. A 1a anual (jul/2026) nao pode ser cobrada duas vezes");
for (const data of [new Date(2026, 7, 6), new Date(2027, 0, 6), new Date(2028, 5, 6)]) {
  const c = calcular("studio", data);
  ok(c.anuaisRestantes <= 3,
     `${data.toLocaleDateString("pt-BR")}: ${c.anuaisRestantes} anuais restantes (max 3, a de 2026 esta na entrada)`);
}
const antes = calcular("studio", new Date(2026, 5, 6)); // junho/2026, antes da 1a anual
ok(antes.anuaisRestantes === 4, `jun/2026: ${antes.anuaisRestantes} anuais restantes (as 4 ainda a vencer)`);

/* ------------------------------------------------------------------------ */
console.log("\n7. Nada negativo, nunca");
for (const data of [new Date(2025, 0, 1), new Date(2035, 0, 1)]) {
  const c = calcular("apto", data);
  const nums = [c.mensaisVencidas, c.mensaisRestantes, c.anuaisRestantes, c.mesesAteEntrega, c.obraAcumulada];
  ok(nums.every((n) => n >= 0), `${data.getFullYear()}: nenhum valor negativo`);
}

/* ------------------------------------------------------------------------ */
console.log("\n8. Tarja de vigencia (INCC)");
ok(calcular("studio", new Date(2026, 7, 6)).valoresVencidos === false, "dentro da validade: sem tarja");
ok(calcular("studio", new Date(2026, 10, 6)).valoresVencidos === true, "apos a validade: com tarja");

/* ------------------------------------------------------------------------ */
console.log("\n9. Entrega");
const c = calcular("studio", new Date(2026, 7, 6));
ok(c.rotuloEntrega === "jul/2030", `rotulo: ${c.rotuloEntrega}`);
ok(c.mesesAteEntrega === 47, `faltam ${c.mesesAteEntrega} meses (esperado 47)`);

console.log(falhas === 0 ? "\nTodas as contas fecham.\n" : `\n${falhas} FALHA(S) — nao publique.\n`);
process.exitCode = falhas ? 1 : 0;
