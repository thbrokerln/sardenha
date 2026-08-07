import {
  COMPROMETIMENTO_RENDA,
  CRONOGRAMA,
  TIPOLOGIAS,
  VIGENCIA,
  type Tipologia,
  type TipologiaId,
} from "../precos.ts";

/* ---------------------------------------------------------------------------
   Aritmetica de meses em valor absoluto (ano*12 + mes). Subtrair campos de
   data separadamente quebra na virada de ano; aqui nao quebra.
--------------------------------------------------------------------------- */

/** "2026-01" -> indice absoluto de mes. */
function indiceDeAaaaMm(aaaaMm: string): number {
  const [ano, mes] = aaaaMm.split("-").map(Number);
  return ano! * 12 + (mes! - 1);
}

function indiceDeData(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

function rotuloDeIndice(i: number): string {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[i % 12]}/${Math.floor(i / 12)}`;
}

const limitar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export type CondicoesCalculadas = {
  tipologia: Tipologia;
  /** Mes de referencia efetivo, ja considerando o dia de virada. */
  mesEfetivo: number;
  mensaisVencidas: number;
  mensaisRestantes: number;
  anuaisRestantes: number;
  /** Uma das 6 parcelas da entrada, sem a obra acumulada. */
  parcelaEntrada: number;
  /** Parcelas mensais de obra ja vencidas, cobradas junto da 1a parcela. */
  obraAcumulada: number;
  /** 1a parcela: 1/6 da entrada + toda a obra ja corrida. */
  entradaDoAto: number;
  /** Soma das 6 parcelas da entrada (a 1a ja inclui a obra acumulada). */
  entradaTotal: number;
  /** Nos meses 2 a 6 a parcela da entrada e a da obra coincidem. */
  mensalSobreposta: number;
  mesesAteEntrega: number;
  rotuloEntrega: string;
  rendaSugerida: number;
  /** Rotulo do mes de referencia dos valores, ex.: "agosto/2026". */
  rotuloVigencia: string;
  /** true depois de VIGENCIA.validoAte — liga a tarja de INCC. */
  valoresVencidos: boolean;
};

/**
 * Calcula as condicoes de uma tipologia para uma data. Funcao pura: mesma
 * entrada, mesma saida — e por isso que da para travar tudo em teste.
 */
export function calcular(id: TipologiaId, hoje: Date = new Date()): CondicoesCalculadas {
  const t = TIPOLOGIAS[id];

  // do dia de virada em diante, ja conta o mes seguinte
  const avanca = hoje.getDate() >= CRONOGRAMA.diaDeVirada ? 1 : 0;
  const mesEfetivo = indiceDeData(hoje) + avanca;

  const inicio = indiceDeAaaaMm(CRONOGRAMA.primeiraMensal);
  const mensaisVencidas = limitar(mesEfetivo - inicio + 1, 0, CRONOGRAMA.totalMensais);
  const mensaisRestantes = CRONOGRAMA.totalMensais - mensaisVencidas;

  // a 1a anual (jul/2026) esta embutida na entrada — nao pode ser contada de novo
  const anuaisRestantes = CRONOGRAMA.anosAnuais.filter(
    (ano) => ano * 12 + (CRONOGRAMA.mesAnual - 1) > mesEfetivo
  ).length;

  const entrada = t.fracao + t.anual;
  const parcelaEntrada = entrada / CRONOGRAMA.parcelasEntrada;
  const obraAcumulada = mensaisVencidas * t.mensal;
  const entradaDoAto = parcelaEntrada + obraAcumulada;
  const entradaTotal = entradaDoAto + (CRONOGRAMA.parcelasEntrada - 1) * parcelaEntrada;

  const entregaIdx = indiceDeAaaaMm(CRONOGRAMA.entrega);

  return {
    tipologia: t,
    mesEfetivo,
    mensaisVencidas,
    mensaisRestantes,
    anuaisRestantes,
    parcelaEntrada,
    obraAcumulada,
    entradaDoAto,
    entradaTotal,
    mensalSobreposta: parcelaEntrada + t.mensal,
    mesesAteEntrega: Math.max(0, entregaIdx - mesEfetivo),
    rotuloEntrega: rotuloDeIndice(entregaIdx),
    rendaSugerida: (t.mensal + t.anual / 12) / COMPROMETIMENTO_RENDA,
    rotuloVigencia: mesPorExtenso(VIGENCIA.valoresDe),
    valoresVencidos: hoje > new Date(`${VIGENCIA.validoAte}T23:59:59`),
  };
}

function mesPorExtenso(aaaaMm: string): string {
  const nomes = ["janeiro","fevereiro","março","abril","maio","junho",
                 "julho","agosto","setembro","outubro","novembro","dezembro"];
  const [ano, mes] = aaaaMm.split("-").map(Number);
  return `${nomes[mes! - 1]}/${ano}`;
}

/* ------------------------------------------------------------------ formato */

const fmtCheio = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

/** R$ 35.606 — sem centavos, que so poluem numero grande em landing. */
export const moeda = (v: number) => fmtCheio.format(Math.round(v));

/** Rotulo do intervalo das mensais restantes, ex.: "set/2026 a dez/2029". */
export function periodoObra(c: CondicoesCalculadas): string {
  const inicio = c.mesEfetivo + 1;
  const fim = indiceDeAaaaMm(CRONOGRAMA.primeiraMensal) + CRONOGRAMA.totalMensais - 1;
  return `${rotuloDeIndice(inicio)} a ${rotuloDeIndice(fim)}`;
}
