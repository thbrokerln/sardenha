/* ===========================================================================
   CONFIG — o unico arquivo que voce precisa editar para colocar no ar.
   =========================================================================== */

export const CONFIG = {
  /** WhatsApp de destino: DDI + DDD + numero, so digitos. */
  whatsapp: "5512991661028",

  /**
   * Base de leads no Supabase. Vazio = envia so pelo WhatsApp.
   *
   * `anonKey` e publica por design — ela fica visivel no navegador de qualquer
   * visitante. A protecao esta na policy RLS (ver supabase/migrations/): com
   * ela, essa chave so consegue INSERIR lead, nunca ler os que ja existem.
   * NUNCA coloque aqui a chave `service_role`: ela ignora RLS e daria acesso
   * total ao banco para qualquer pessoa que abrir o codigo-fonte da pagina.
   */
  supabase: {
    url: "https://vcvgbslltyukbbruhfjb.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjdmdic2xsdHl1a2JicnVoZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDU1NDAsImV4cCI6MjEwMTYyMTU0MH0.g9uU_PNFW4pm3_Gr3W1l9sxGHTJq-znmy277cQCs8lQ",
    /** Slug em public.projetos. E o que separa esta landing das outras. */
    projeto: "sardenha",
  },

  /** Alternativa/extra: webhook n8n, CRM, Formspree. Vazio = ignorado. */
  formEndpoint: "", // <<< OPCIONAL

  /** Link do book em PDF, se quiser oferecer download. Vazio = esconde o botao. */
  pdfBook: "", // <<< OPCIONAL

  /** IDs de rastreamento. Vazio = o script nem carrega. */
  metaPixelId: "", // <<< TROCAR
  ga4Id: "", // <<< TROCAR

  /** Dominio canonico, usado no <link rel=canonical> e no JSON-LD. */
  siteUrl: "https://sardenha.thimoveiscaragua.com",
} as const;

/* ---------------------------------------------------------------------------
   NUMEROS PENDENTES DE CONFIRMACAO
   ---------------------------------------------------------------------------
   Nada aqui vai ao ar por padrao. Sao os dados que NAO constam no book e que
   precisam de fonte antes de virar copy publica (material publicitario
   imobiliario responde por CDC art. 30 e 37).

   Para exibir a faixa de preco no hero e no formulario, preencha `precoDe`
   com o valor real da tabela vigente e mude `exibirPreco` para true.
--------------------------------------------------------------------------- */
export const PENDENTE = {
  exibirPreco: false,
  precoDe: "", // ex.: "R$ 000 mil" — valor da tabela vigente, conferido
} as const;
