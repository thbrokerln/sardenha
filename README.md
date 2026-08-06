# Residencial Sardenha — landing de captação

Landing single-page para tráfego pago (Meta/Google), com o objetivo único de
gerar lead qualificado no WhatsApp. Vite + TypeScript vanilla, GSAP/ScrollTrigger
+ Lenis, deploy estático.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # gera /dist
npm run preview      # serve /dist em :4173
```

---

## ⚠️ Antes de publicar

### 1. Preencher `src/config.ts`

| Campo | Status |
|---|---|
| `whatsapp` | ✅ `5512991661028` |
| `siteUrl` | ✅ `https://sardenha.thimoveiscaragua.com` |
| `supabase.url` / `.projeto` | ✅ preenchidos |
| `supabase.anonKey` | ✅ colada e validada (`role: anon`) |
| `metaPixelId` / `ga4Id` | ⬜ vazio = o script nem carrega |
| `formEndpoint` | ⬜ opcional (n8n / CRM) |
| `pdfBook` | ⬜ opcional |

---

## Publicar na HostGator

O `dist/` é estático e já inclui um `.htaccess` pronto.

1. **DNS** — cPanel → Domínios → Zone Editor:
   `A` · `sardenha` · `162.240.81.81`
2. **Subdomínio** — cPanel → Domínios → Criar: `sardenha.thimoveiscaragua.com`,
   raiz `public_html/sardenha`
3. **Upload** — envie o **conteúdo de dentro** de `dist/` (não a pasta) para
   `public_html/sardenha`. Confirme que o `.htaccess` foi junto: no File Manager,
   Settings → *Show Hidden Files*.
4. **SSL** — cPanel → SSL/TLS Status → marque o subdomínio → *Run AutoSSL*.
   Espere sair o certificado; o `.htaccess` força HTTPS e o site fica
   inacessível se ligar antes.

O `.htaccess` resolve três coisas que quebram silenciosamente no Apache da
HostGator: o MIME type de **AVIF** e **WOFF2** (sem ele o navegador descarta o
AVIF e baixa o JPEG, várias vezes mais pesado), cache longo em mídia e fontes,
e HTTPS forçado.

### Atualizar depois

`npm run build` e substitua os arquivos. O `index.html` tem `must-revalidate`,
então a troca chega na hora; os assets têm hash no nome, então não conflitam.

### 2. Números que foram cortados de propósito

A versão original do texto trazia estatísticas de mercado (8ª melhor cidade para
investir, 33% de crescimento populacional, 98% de ocupação, R$ 7.350/mês de
receita, ~2x o aluguel fixo, "a partir de R$ 250 mil"). **Nenhuma delas está na
página.** Nada disso consta do book do empreendimento e não foi possível
verificar a fonte — e material publicitário imobiliário responde por CDC arts.
30 e 37, então número não conferido vira risco jurídico, não argumento de venda.

A página inteira usa apenas fatos verificáveis no book: 250m da praia, 4 torres,
9 pavimentos, 6 unidades por andar, 216 unidades, 43m²/61m², mix por final,
16 espaços de lazer, vaga + hobby box, e os nomes de incorporadora e
desenvolvedora.

Isso virou uma vantagem de conversão: preço, condições e simulação são
justamente o motivo para a pessoa preencher o formulário, em vez de estarem de
graça na página. Se quiser exibir a faixa de preço no hero, preencha
`PENDENTE.precoDe` em `src/config.ts` com o valor real da tabela vigente e mude
`exibirPreco` para `true`.

### 3. Escassez — confira antes de usar como argumento

O argumento central da seção de plantas ("144 unidades de 61m² contra 72 de
43m²") vem da página 27 do book: 4 torres × 9 andares × 6 unidades, sendo os
finais 1/3/4/6 de 2 suítes e os finais 2/5 de 1 suíte. **Confirme com o memorial
de incorporação registrado** antes de rodar mídia paga em cima disso.

---

## Decisões de projeto que fogem do briefing

**Paleta.** O briefing pedia para herdar a identidade do book e em seguida
fornecia tokens verde-floresta. Amostrando os pixels das páginas reais, o book
não tem verde nenhum: é `#fdfaf5` papel, `#bdc6c7` cinza-azulado institucional,
`#b86631` terracota e `#353535` tinta. A landing seguiu o book. O `--slate`
(`#223033`) é a única cor derivada — o `--sea` dessaturado e escurecido, porque
o book não tem um escuro próprio e a página precisava de âncora cinematográfica.

**Terracota dos CTAs.** O `#b86631` do book, com texto branco por cima, dá
4.21:1 — reprova em WCAG AA para texto normal, justamente na cor de todos os
botões. Está `#b25f2c` (4.60:1). A diferença é imperceptível ao lado do material
impresso. O hover escurece em vez de clarear, pelo mesmo motivo.

**Morph de fundo entre seções.** Estava no briefing e foi cortado. Ele exige
deixar as seções transparentes e animar o `body`; qualquer dessincronia entre os
dois joga texto escuro sobre fundo escuro e o conteúdo some. Um efeito que pode
apagar a página não paga o custo.

---

## Estrutura

```
index.html               markup completo (single page)
src/
  config.ts              ← o arquivo que você edita para publicar
  main.ts                entrada; decide se carrega o motor de animação
  modules/
    motion.ts            GSAP + Lenis: preloader, hero, reveals, pin, cursor
    form.ts              validação, máscara de telefone, deep link WhatsApp
    analytics.ts         GA4 + Meta Pixel + captura de UTM
    variants.ts          variantes de hero por ?v=
  styles/
    main.css             design system + todas as seções
    fonts.css            gerado por scripts/fetch_fonts.py — não editar
public/
  media/                 renders otimizados (AVIF + WebP + JPEG)
  fonts/                 Fraunces + Manrope auto-hospedadas
scripts/
  build_assets.py        extrai o book e gera as imagens responsivas
  fetch_fonts.py         baixa as fontes para auto-hospedagem
  shoot.mjs              QA visual em 3 viewports + passe de movimento reduzido
  a11y.mjs               auditoria de contraste WCAG AA
  diag.mjs               diagnóstico pontual de animação
```

### Trocar as mídias

As imagens saem direto do PDF do book:

```bash
python3 -m venv .venv && .venv/bin/pip install pillow pymupdf
.venv/bin/python scripts/build_assets.py "BOOK _ SARDENHA _ Lollo Ganassali.pdf"
```

O mapa de qual página vira qual imagem está no dicionário `MAP` do script.
Renders sobre fundo preto (fachadas e plantas) são compostos sobre a cor exata
da seção onde aparecem — recortar em alpha produzia serrilhado, porque a borda
do prédio contra o preto está cheia de artefato de JPEG.

Para trocar por clipes animados (Higgsfield), substitua o `<picture>` do hero em
`index.html` por um `<video muted loop playsinline poster="/media/hero-aerea.jpg">`
e mantenha o `poster` — ele é o LCP.

---

## Base de leads (Supabase) — uma base para todas as landings

Projeto: `vcvgbslltyukbbruhfjb`

**Desenho:** uma tabela `leads` para todos os lançamentos, separada pela coluna
`projeto`, que é FK para a tabela `projetos`. Landing nova = uma linha em
`projetos`. Slug digitado errado é recusado pelo banco na hora, em vez de virar
lead órfão que ninguém encontra depois.

### Aplicar o schema

```bash
supabase link --project-ref vcvgbslltyukbbruhfjb
supabase db push
```

Depois cole a chave **`anon public`** (Settings → API Keys) em
`supabase.anonKey` no `src/config.ts` e valide:

```bash
node scripts/test-supabase.mjs
```

Esse script não testa só o caminho feliz — ele confirma que a chave pública
**insere mas não lê, não apaga e não aceita slug inválido**. Se a RLS estiver
frouxa ele avisa em vermelho. Rode antes de publicar.

### Sobre a chave `anon`

Ela é pública por design: fica visível no navegador de qualquer visitante. A
proteção é a policy RLS, não a chave. **Nunca** coloque a `service_role` no
`config.ts` — ela ignora RLS e daria acesso total ao banco para quem abrir o
código-fonte da página.

### Adicionar a próxima landing

```sql
insert into public.projetos (slug, nome)
values ('nome-do-projeto', 'Nome completo do lançamento');
```

E no `config.ts` da landing nova, `supabase.projeto: "nome-do-projeto"`. Mesma
URL, mesma chave, mesma tabela.

### Consultar

```sql
-- leads de um projeto, mais recentes primeiro
select criado_em, nome, whatsapp, objetivo, unidade, utm_source, status
from leads where projeto = 'sardenha' order by criado_em desc;

-- volume por projeto e origem
select projeto, coalesce(utm_source,'direto') as origem, count(*)
from leads group by 1,2 order by 3 desc;
```

O campo `status` já vem com o funil (`novo`, `contatado`, `qualificado`,
`visita`, `proposta`, `fechado`, `perdido`) para o time atualizar pelo painel.

### Anti-spam

O formulário tem um honeypot (campo `empresa`, fora da tela e fora da ordem de
foco). Preenchido = não grava no banco, mas ainda abre o WhatsApp — se por acaso
for uma pessoa real, é melhor perder o registro do que perder o lead.

---

## Tráfego pago

- **Variantes de hero por URL:** `?v=inv` (investidor) e `?v=1imovel` (primeiro
  imóvel) trocam H1, subtítulo e o card destacado. Sem parâmetro, cai no texto
  padrão que fala com os dois. Editáveis em `src/modules/variants.ts`.
- **UTMs** (`utm_*`, `fbclid`, `gclid`) são capturados, guardados na sessão e
  anexados ao payload do formulário.
- **Eventos:** `generate_lead` + `Lead` no envio; `whatsapp_click` + `Contact`
  nos botões de WhatsApp; `cta_click` em cada CTA (identificado por `data-cta`).
- **Pré-seleção:** qualquer elemento com `data-perfil` preenche o campo
  "objetivo" do formulário ao ser clicado.

---

## Qualidade — medido, não estimado

Lighthouse contra `npm run preview` (build de produção):

| | Perf | A11y | Best Pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |
| Mobile | 99 | 100 | 100 | 100 | 2.3 s | 0 | 0 ms |

```bash
node scripts/a11y.mjs http://localhost:4173/    # contraste AA
node scripts/shoot.mjs http://localhost:4173/ qa # screenshots 390/768/1440 + reduced
```

**Nota para quem for rodar QA:** o Chrome headless reporta
`prefers-reduced-motion: reduce` por padrão. Sem emular `no-preference` você
fotografa só a versão estática e conclui, errado, que as animações quebraram.
Os dois scripts já emulam.

### Movimento reduzido

Com `prefers-reduced-motion: reduce`, GSAP e Lenis **não são baixados** (~56 KB
gzip a menos) e a página entrega tudo estático e legível — inclusive os
contadores, que são escritos com o valor final em vez de ficarem em zero.

---

## Deploy

Estático. `npm run build` gera `/dist`.

- **Vercel / Netlify / Cloudflare Pages:** build `npm run build`, output `dist`.
- Sirva `/fonts/*.woff2` e `/media/*` com cache longo (`immutable`); os nomes são
  estáveis, então versione trocando o arquivo.
