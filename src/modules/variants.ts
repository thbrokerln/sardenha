/* ===========================================================================
   Variantes de hero por conjunto de anuncio.
   Uso: ?v=inv (investidor) | ?v=1imovel (primeiro imovel) | ausente = padrao.
   Troca apenas o H1, o subtitulo e qual card da bifurcacao vem destacado —
   o resto da pagina e identico, para o teste medir a mensagem e nada mais.
   =========================================================================== */

type Variant = {
  h1: string;
  sub: string;
  /** indice do card destacado em .fork__card */
  destaque: number;
};

const VARIANTES: Record<string, Variant> = {
  inv: {
    h1: "São 216 unidades a 250m do mar. Só 72 são o tíquete de entrada.",
    sub: "Residencial Sardenha, na Praia do Massaguaçu. Em cada andar são quatro apartamentos de 61m² e apenas dois studios de 43m² — o formato mais líquido do empreendimento, ainda na fase de obra.",
    destaque: 0,
  },
  "1imovel": {
    h1: "Seu primeiro apartamento a 250m do mar — ainda na planta.",
    sub: "Residencial Sardenha, na Praia do Massaguaçu. Comprando direto com a incorporadora durante a obra, a entrada e as parcelas ficam distribuídas no cronograma em vez de tudo de uma vez.",
    destaque: 1,
  },
};

export function initHeadlineVariant(): void {
  const key = new URLSearchParams(location.search).get("v");
  if (!key) return;

  const v = VARIANTES[key];
  if (!v) return;

  const h1 = document.querySelector<HTMLElement>("[data-hero-h1]");
  const sub = document.querySelector<HTMLElement>("[data-hero-sub]");
  if (h1) h1.textContent = v.h1;
  if (sub) sub.textContent = v.sub;

  const cards = document.querySelectorAll<HTMLElement>(".fork__card");
  cards.forEach((c, i) => c.classList.toggle("is-featured", i === v.destaque));

  document.documentElement.dataset.variant = key;
}
