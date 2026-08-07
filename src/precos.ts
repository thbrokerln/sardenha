/* ===========================================================================
   CONDICOES DE PAGAMENTO — dados do espelho da incorporadora.

   >>> MANUTENCAO MENSAL: voce edita SO DUAS COISAS aqui.
       1. `mensal` de cada tipologia, quando o INCC reajustar
       2. o bloco VIGENCIA logo abaixo

   Todo o resto — quantas parcelas ja venceram, quanto de obra acumulada entra
   na entrada do ato, quantas faltam, quantos meses ate a entrega — o site
   calcula sozinho a partir da data de hoje. Nao mexa a mao nesses numeros.
   =========================================================================== */

export const CRONOGRAMA = {
  /** Mes da 1a das parcelas mensais de obra (formato AAAA-MM). */
  primeiraMensal: "2026-01",
  /** Total de parcelas mensais de obra previstas em contrato. */
  totalMensais: 48,
  /** Mes em que caem as parcelas anuais (7 = julho). */
  mesAnual: 7,
  /** Anos das parcelas anuais. */
  anosAnuais: [2026, 2027, 2028, 2029],
  /** Entrega prevista das chaves (AAAA-MM). */
  entrega: "2030-07",
  /** Em quantas vezes a entrada e diluida. */
  parcelasEntrada: 6,
  /**
   * A partir deste dia do mes, o site ja conta o mes seguinte como vencido.
   * Existe porque quem pede proposta no fim do mes so vai pagar no mes que vem
   * — sem isso o site mostraria um valor que o corretor teria de corrigir na
   * conversa.
   */
  diaDeVirada: 25,
} as const;

/**
 * Valores do 1o andar (os mais baratos). O espelho tem acrescimo por andar
 * (+R$ 3.000 no studio, +R$ 5.000 no apto), por isso a pagina comunica
 * "a partir de" e o andar exato fica para a conversa de vendas.
 */
export const TIPOLOGIAS = {
  studio: {
    id: "studio",
    rotulo: "Studio 43,87m²",
    rotuloCurto: "Studio",
    area: 43.87,
    descricao: "1 suíte · 1 vaga + hobby box",
    /** Fracao ideal do terreno. */
    fracao: 70000,
    /** Parcela mensal de obra. <<< AJUSTAR NO REAJUSTE DO INCC */
    mensal: 2680.02,
    /** Parcela anual (julho). */
    anual: 15000,
    /** Valor total conforme espelho — usado para travar o teste. */
    total: 258641,
    /** Valor que o formulario recebe ao clicar no CTA deste bloco. */
    unidadeForm: "43m² — 1 suíte",
  },
  apto: {
    id: "apto",
    rotulo: "Apto 61,42m²",
    rotuloCurto: "Apartamento",
    area: 61.42,
    descricao: "2 suítes + lavabo · 1 vaga + hobby box",
    fracao: 100000,
    /** <<< AJUSTAR NO REAJUSTE DO INCC */
    mensal: 3835.54,
    anual: 20000,
    total: 364106,
    unidadeForm: "61m² — 2 suítes",
  },
} as const;

export const VIGENCIA = {
  /** Mes de referencia dos valores acima — aparece no rodape do bloco. */
  valoresDe: "2026-08",
  /**
   * Depois desta data os valores continuam visiveis, mas com tarja avisando
   * que podem ter sido corrigidos pelo INCC.
   */
  validoAte: "2026-09-30",
} as const;

/** Percentual da renda considerado comprometivel no calculo da renda sugerida. */
export const COMPROMETIMENTO_RENDA = 0.3;

export type TipologiaId = keyof typeof TIPOLOGIAS;
export type Tipologia = (typeof TIPOLOGIAS)[TipologiaId];
