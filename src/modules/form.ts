import { CONFIG } from "../config";
import { TIPOLOGIAS } from "../precos.ts";
import { captureAttribution, trackContact, trackLead } from "./analytics";
import { moeda } from "./precos.ts";

const waLink = (text: string) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

/** (12) 90000-0000 conforme digita. */
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

const digits = (v: string) => v.replace(/\D/g, "");

/** Grava o lead no Supabase via API REST (PostgREST). */
async function saveToSupabase(
  data: Record<string, string>,
  atrib: Record<string, string>,
  pagina: string
): Promise<void> {
  const { url, anonKey, projeto } = CONFIG.supabase;
  if (!url || !anonKey) return;

  const row = {
    projeto,
    nome: data.nome?.trim(),
    whatsapp: data.whats?.trim(),
    objetivo: data.perfil ?? null,
    unidade: data.unidade ?? null,
    andar: data.andar ?? null,
    utm_source: atrib.utm_source ?? null,
    utm_medium: atrib.utm_medium ?? null,
    utm_campaign: atrib.utm_campaign ?? null,
    utm_content: atrib.utm_content ?? null,
    utm_term: atrib.utm_term ?? null,
    fbclid: atrib.fbclid ?? null,
    gclid: atrib.gclid ?? null,
    pagina,
  };

  try {
    const res = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        // nao devolve o registro criado: a chave anon nao tem permissao de
        // leitura, entao pedir retorno faria a requisicao falhar
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.error("[leads] Supabase recusou:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[leads] falha de rede ao gravar:", err);
  }
}

/** Webhook opcional (n8n / CRM / Formspree). */
async function postToWebhook(payload: Record<string, unknown>): Promise<void> {
  if (!CONFIG.formEndpoint) return;
  try {
    await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* segue para o WhatsApp mesmo se o webhook cair */
  }
}

const primeiroNome = (n: string | undefined) => (n ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * Monta a mensagem que a pessoa envia pelo WhatsApp.
 *
 * Duas regras que vieram de ver uma mensagem real chegando:
 *
 * 1. NAO repetir o telefone. Ela esta escrevendo do proprio WhatsApp — o
 *    numero ja aparece no cabecalho da conversa. Repetir dentro do texto faz
 *    a mensagem parecer despejo de formulario, nao gente falando.
 * 2. Terminar com pedido concreto. "Quero o material" nao abre conversa; abre
 *    um "vou te mandar". Pedir a tabela do andar e a disponibilidade da ao
 *    corretor algo exato para responder na primeira mensagem.
 *
 * O trecho sobre entrada em 6x e ausencia de banco tambem trabalha a favor:
 * sinaliza que ela ja viu o modelo de pagamento e nao vai se surpreender.
 */
function montarMensagem(data: Record<string, string>): string {
  const escolheuUnidade = data.unidade && data.unidade !== "Ainda não sei";

  const itens = [
    escolheuUnidade ? `• Unidade: ${data.unidade}` : `• Unidade: quero entender as duas opções`,
    `• Objetivo: ${(data.perfil ?? "").toLowerCase()}`,
    // rotulo "Preferencia" para nao sair "Andar: andar alto"
    data.andar ? `• Preferência: ${data.andar.toLowerCase()}` : "",
  ].filter(Boolean);

  return [
    `Olá! Sou ${data.nome}.`,
    ``,
    `Vi a página do Residencial Sardenha e quero avançar.`,
    ``,
    ...itens,
    ``,
    `Já vi as condições na página (entrada diluída em 6x, pagamento direto com a incorporadora, sem financiamento bancário).`,
    ``,
    `Pode me mandar a tabela com os valores de hoje e o que ainda está disponível?`,
  ].join("\n");
}

function setError(input: HTMLInputElement, on: boolean): void {
  input.closest(".field")?.classList.toggle("is-invalid", on);
  const err = document.querySelector<HTMLElement>(`[data-err-for="${input.name}"]`);
  if (err) err.hidden = !on;
  input.setAttribute("aria-invalid", String(on));
}

/**
 * Botao flutuante do WhatsApp.
 *
 * A mensagem carrega os valores das duas tipologias de proposito. Ele fica
 * disponivel desde o topo, entao da para sair da pagina sem rolar nada — e era
 * o que estava acontecendo: lead chegando e perguntando "quanto custa" depois
 * de ja ter recebido o material. Com o preco dentro da propria mensagem, mesmo
 * quem pula a pagina chega sabendo, e a conversa comeca filtrada.
 */
export function initWhatsAppFloat(): void {
  const el = document.getElementById("waFloat") as HTMLAnchorElement | null;
  if (!el) return;

  const precos = Object.values(TIPOLOGIAS)
    .map((t) => `${t.rotulo} — ${moeda(t.total)}`)
    .join("\n");

  el.href = waLink(
    [
      "Olá! Vi a página do Residencial Sardenha.",
      "",
      precos,
      "",
      "Vi que a entrada é diluída em 6x e que o pagamento é direto com a incorporadora, sem financiamento bancário.",
      "",
      "Pode me confirmar as condições atualizadas e o que ainda está disponível?",
    ].join("\n")
  );
  el.addEventListener("click", () => trackContact({ origem: "float" }));
}

/**
 * CTAs com data-perfil / data-unidade pre-selecionam o formulario.
 * Delegado no documento porque o bloco de pagamento reescreve o data-unidade
 * do proprio CTA quando o visitante troca de tipologia — um listener preso ao
 * elemento leria o valor de quando a pagina carregou.
 */
export function initPerfilPresets(): void {
  const aplicar = (selectId: string, valor: string | undefined) => {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select || !valor) return;
    if ([...select.options].some((o) => o.value === valor)) {
      select.value = valor;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  document.addEventListener("click", (e) => {
    const alvo = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-perfil], [data-unidade]"
    );
    if (!alvo) return;
    aplicar("perfil", alvo.dataset.perfil);
    aplicar("unidade", alvo.dataset.unidade);
  });
}

export function initForm(): void {
  const form = document.getElementById("leadForm") as HTMLFormElement | null;
  if (!form) return;

  const nome = form.elements.namedItem("nome") as HTMLInputElement;
  const whats = form.elements.namedItem("whats") as HTMLInputElement;
  const ok = document.getElementById("formOk") as HTMLElement;

  whats.addEventListener("input", () => {
    whats.value = maskPhone(whats.value);
    if (whats.getAttribute("aria-invalid") === "true") setError(whats, digits(whats.value).length < 10);
  });
  nome.addEventListener("input", () => {
    if (nome.getAttribute("aria-invalid") === "true") setError(nome, nome.value.trim().length < 2);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const badNome = nome.value.trim().length < 2;
    const badWhats = digits(whats.value).length < 10;
    setError(nome, badNome);
    setError(whats, badWhats);
    if (badNome || badWhats) {
      (badNome ? nome : whats).focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // honeypot: campo escondido que so robo preenche. Se veio preenchido, nao
    // grava no banco — mas ainda abre o WhatsApp, porque se por acaso for uma
    // pessoa de verdade e melhor perder o registro do que perder o lead.
    const spam = (data.empresa ?? "").trim().length > 0;

    const atrib = captureAttribution();
    const pagina = location.pathname + location.search;

    trackLead({ objetivo: data.perfil ?? "", unidade: data.unidade ?? "" });

    // 1) WhatsApp PRIMEIRO, ainda dentro do gesto do clique.
    //    Se abrisse depois de um `await`, o navegador perderia o vinculo com a
    //    acao do usuario e trataria a janela como popup — bloqueando justamente
    //    a conversao que importa. Vale tambem para a confirmacao na tela: ela
    //    nao pode esperar a ida ao banco.
    window.open(waLink(montarMensagem(data)), "_blank", "noopener");

    ok.textContent =
      `Pronto, ${primeiroNome(data.nome)}. Abrimos seu WhatsApp com o resumo — ` +
      `é só enviar. Se não abrir, use o botão verde no canto da tela.`;
    ok.hidden = false;

    // 2) so entao grava, sem segurar a interface. Se falhar, o lead ja chegou
    //    no WhatsApp de qualquer forma.
    if (!spam) {
      void Promise.allSettled([
        saveToSupabase(data, atrib, pagina),
        postToWebhook({ ...data, ...atrib, pagina, enviado_em: new Date().toISOString() }),
      ]);
    }

    form.reset();
  });
}
