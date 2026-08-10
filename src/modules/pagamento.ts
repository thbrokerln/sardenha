import { CRONOGRAMA, TIPOLOGIAS, type TipologiaId } from "../precos.ts";
import { calcular, moeda, periodoObra, type CondicoesCalculadas } from "./precos.ts";

const num = new Intl.NumberFormat("pt-BR");

/** Lista os anos das anuais que ainda vao vencer: "2027, 2028 e 2029". */
function anosRestantes(c: CondicoesCalculadas): string {
  const anos = CRONOGRAMA.anosAnuais.filter(
    (ano) => ano * 12 + (CRONOGRAMA.mesAnual - 1) > c.mesEfetivo
  );
  if (anos.length === 0) return "";
  if (anos.length === 1) return String(anos[0]);
  return `${anos.slice(0, -1).join(", ")} e ${anos[anos.length - 1]}`;
}

function preencher(raiz: HTMLElement, id: TipologiaId): void {
  const c = calcular(id);
  const t = c.tipologia;

  const valores: Record<string, string> = {
    descricao: t.descricao,
    rotuloCurto: t.id === "studio" ? "do studio" : "do apartamento",
    mensaisVencidas: num.format(c.mensaisVencidas),
    entradaDoAto: moeda(c.entradaDoAto),
    parcelaEntrada: moeda(c.parcelaEntrada),
    entradaTotal: moeda(c.entradaTotal),
    periodoObra: periodoObra(c),
    mensaisRestantes: num.format(c.mensaisRestantes),
    mensal: moeda(t.mensal),
    anuaisRestantes: num.format(c.anuaisRestantes),
    anosAnuais: anosRestantes(c),
    anual: moeda(t.anual),
    mensalSobreposta: moeda(c.mensalSobreposta),
    total: moeda(t.total),
    rotuloEntrega: c.rotuloEntrega,
    mesesAteEntrega: num.format(c.mesesAteEntrega),
    rendaSugerida: moeda(c.rendaSugerida),
    rotuloVigencia: c.rotuloVigencia,
  };

  for (const [slot, texto] of Object.entries(valores)) {
    raiz.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`).forEach((el) => {
      el.textContent = texto;
    });
  }

  /* A urgencia mais forte deste produto e a unica que nao precisa ser
     inventada: a obra corre, e cada mes que passa acrescenta uma parcela
     vencida a entrada do ato. O numero sai do proprio espelho. */
  const urg = raiz.querySelector<HTMLElement>('[data-slot="urgencia"]');
  if (urg) {
    const acabou = c.mensaisRestantes === 0;
    urg.hidden = acabou;
    if (!acabou) {
      urg.innerHTML =
        `Cada mês de espera acrescenta mais uma parcela de obra à entrada do ato: ` +
        `<b>${moeda(t.mensal)}</b> a mais por mês. Em três meses, ` +
        `<b>${moeda(t.mensal * 3)}</b>.`;
    }
  }

  // tarja de INCC: os valores continuam na tela, com o aviso por cima
  const tarja = raiz.querySelector<HTMLElement>('[data-slot="tarjaIncc"]');
  if (tarja) {
    tarja.hidden = !c.valoresVencidos;
    if (c.valoresVencidos) {
      tarja.textContent =
        `Valores de referência de ${c.rotuloVigencia}. Podem ter sido corrigidos pelo INCC desde então — ` +
        `confirme as condições atualizadas no WhatsApp antes de decidir.`;
    }
  }

  // quando a obra acaba, o bloco de parcelas perde o sentido
  const blocoObra = raiz.querySelector<HTMLElement>("[data-bloco-obra]");
  if (blocoObra) blocoObra.hidden = c.mensaisRestantes === 0;

  // o CTA leva a unidade escolhida para o formulario
  const cta = raiz.querySelector<HTMLElement>(".pagto__cta");
  if (cta) cta.dataset.unidade = t.unidadeForm;

  raiz.querySelector("[role=tabpanel]")?.setAttribute("aria-labelledby", `tab-${id}`);
}

export function initPagamento(): void {
  const card = document.querySelector<HTMLElement>(".pagto__card");
  if (!card) return;

  const tabs = [...card.querySelectorAll<HTMLButtonElement>(".pagto__tab")];
  if (tabs.length === 0) return;

  // preco de cada tipologia na propria aba, para os dois ficarem visiveis
  // sem clique nenhum
  for (const b of tabs) {
    const t = TIPOLOGIAS[b.dataset.tipo as TipologiaId];
    const alvo = b.querySelector<HTMLElement>(".pagto__tab-preco");
    if (t && alvo) alvo.textContent = moeda(t.total);
  }

  const trocar = (id: TipologiaId) => {
    tabs.forEach((b) => {
      const ativa = b.dataset.tipo === id;
      b.classList.toggle("is-on", ativa);
      b.setAttribute("aria-selected", String(ativa));
      b.tabIndex = ativa ? 0 : -1;
    });
    preencher(card, id);
  };

  tabs.forEach((b) => {
    b.addEventListener("click", () => trocar(b.dataset.tipo as TipologiaId));
    // navegacao por seta, como manda o padrao de tablist
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const i = tabs.indexOf(b);
      const alvo = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
      alvo.focus();
      trocar(alvo.dataset.tipo as TipologiaId);
    });
  });

  // recalcula na carga: o HTML traz os valores da data do build
  const inicial = (tabs.find((b) => b.classList.contains("is-on"))?.dataset.tipo ??
    Object.keys(TIPOLOGIAS)[0]) as TipologiaId;
  trocar(inicial);
}
