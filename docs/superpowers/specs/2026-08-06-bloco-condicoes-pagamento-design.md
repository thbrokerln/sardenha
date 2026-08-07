# Bloco de condições de pagamento — Residencial Sardenha

**Data:** 2026-08-06
**Status:** aprovado, pronto para implementação

---

## Problema

A landing não mostra preço. Os valores existem e são oficiais (espelho da
incorporadora, 18/06/2026), mas têm duas características que impedem simplesmente
escrevê-los no HTML:

1. **Mudam todo mês.** O empreendimento é *obra a preço de custo*: quem entra hoje
   paga as parcelas de obra que já venceram desde janeiro/2026. A cada mês que
   passa, esse acumulado cresce e o número de parcelas restantes cai. O material
   que o corretor tinha em mãos (gerado em julho) já estava desatualizado em
   R$ 2.680,02 uma semana depois.
2. **Corrigem pelo INCC.** O valor da parcela mensal sobe periodicamente e não há
   como o site saber disso sozinho.

Além disso, a estrutura de pagamento é incomum e precisa ser explicada cedo: **não
aceita FGTS e não há financiamento bancário** — as parcelas quitam 100% do imóvel.
Se o visitante só descobre isso no fim da página, a atenção foi desperdiçada.

## Objetivo

Um bloco que:

- **filtre** lead sem caixa antes de ocupar tempo do time de vendas;
- **persuada** mostrando o que o concorrente esconde (ausência de saldo bancário);
- **se atualize sozinho** a cada virada de mês, deixando para o operador apenas os
  valores que o INCC corrige.

Público-alvo: **investidor** e **veraneio** (compra de segundo imóvel). O perfil
"primeiro imóvel / sair do aluguel" foi descartado — sem FGTS e sem financiamento,
esse comprador não consegue entrar.

---

## A estrutura de pagamento (verificada contra o espelho)

O espelho define, por unidade:

```
TOTAL = Fração do terreno  +  Obra
                              └─ R$ 4.300/m² = 48 mensais + 4 anuais (julho)
```

| | Studio 43,87 m² | Apto 61,42 m² |
|---|---|---|
| Fração (1º andar, sobe por andar) | R$ 70.000 | R$ 100.000 |
| 48 mensais (jan/2026 → dez/2029) | R$ 2.680,02 | R$ 3.835,54 |
| 4 anuais (jul 2026, 27, 28, 29) | R$ 15.000 | R$ 20.000 |
| **Total (1º andar)** | **R$ 258.641** | **R$ 364.106** |

Conferência: `48 × 2.680,02 + 4 × 15.000 = 188.640,96 = 43,87 × 4.300` ✓

**Condição negociada vigente:** a *entrada* — definida como `fração + 1ª anual de
julho/2026` — é diluída em 6 parcelas. As mensais de obra já vencidas entram
somadas à 1ª parcela.

```
entrada        = fração + anual              (studio: 70.000 + 15.000 = 85.000)
parcelaEntrada = entrada / 6                 (studio: 14.166,67)
obraAcumulada  = mensaisVencidas × mensal
entradaDoAto   = parcelaEntrada + obraAcumulada
```

Nos meses 2 a 6 o comprador paga `parcelaEntrada + mensal` simultaneamente. Isso
**deve** aparecer na tela — descobrir no contrato destrói a confiança.

**Correção registrada:** o material gerado por IA que circulou trazia a 1ª parcela
do 61m² como R$ 47.548,78. O valor coerente com o espelho é **R$ 46.848,78**
(diferença de R$ 700, que fazia a soma estourar o total em R$ 699,92).

---

## Posicionamento na página

Segunda dobra, imediatamente após o hero.

| # | Seção | Função |
|---|---|---|
| 1 | Hero + linha de gancho | prende e sinaliza a faixa de preço |
| 2 | **Condições de pagamento** | **filtra** |
| 3 | O endereço | justifica o preço |
| 4 | Bifurcação investidor / veraneio | segmenta quem passou |
| 5+ | Lazer, plantas, localização, contato, FAQ | convence |

Linha de gancho no hero, abaixo dos CTAs:
> Studios a partir de R$ 258.641 · entrada em 6x · sem financiamento bancário

A seção atual **"A janela de entrada"** é removida: o novo bloco conta a mesma
história com números. Sua timeline (Lançamento → Construção → Entrega) é absorvida
pelo bloco.

---

## Modelo de dados

Arquivo novo `src/precos.ts`, separado de `config.ts` porque tem ciclo de vida
próprio (muda mensalmente, enquanto `config.ts` é praticamente estático).

```ts
export const CRONOGRAMA = {
  primeiraMensal: "2026-01",   // 1ª das 48 parcelas de obra
  totalMensais: 48,
  mesAnual: 7,                 // julho
  anosAnuais: [2026, 2027, 2028, 2029],
  entrega: "2030-07",
  parcelasEntrada: 6,
  diaDeVirada: 25,             // do dia 25 já conta o mês seguinte
} as const;

export const TIPOLOGIAS = {
  studio: { rotulo: "Studio 43,87m²", area: 43.87, suites: 1,
            fracao: 70000,  mensal: 2680.02, anual: 15000, total: 258641 },
  apto:   { rotulo: "Apto 61,42m²",   area: 61.42, suites: 2,
            fracao: 100000, mensal: 3835.54, anual: 20000, total: 364106 },
} as const;

export const VIGENCIA = {
  valoresDe: "2026-08",        // carimbo exibido
  validoAte: "2026-09-30",     // depois disso aparece a tarja de INCC
} as const;
```

`fracao`, `mensal`, `anual` e `total` são do **1º andar** (menor preço). A página
comunica "a partir de"; o espelho tem variação por andar (+R$3.000/andar no studio,
+R$5.000 no apto) que fica para a conversa de vendas.

### Manutenção mensal do operador

Editar **dois números** — `studio.mensal` e `apto.mensal` — quando o INCC corrigir,
e atualizar `VIGENCIA`. Todo o resto é derivado.

---

## Cálculos derivados

Módulo `src/modules/precos.ts`, função pura `calcular(tipologia, hoje)`.

```
mesEfetivo      = hoje.dia >= diaDeVirada ? mês seguinte : mês corrente
mensaisVencidas = clamp(meses de primeiraMensal até mesEfetivo, 0, totalMensais)
mensaisRestantes= totalMensais - mensaisVencidas
anuaisVencidas  = anosAnuais.filter(ano => (ano, mesAnual) <= mesEfetivo).length
anuaisRestantes = anosAnuais.length - anuaisVencidas

entrada         = fracao + anual
parcelaEntrada  = entrada / parcelasEntrada
obraAcumulada   = mensaisVencidas × mensal
entradaDoAto    = parcelaEntrada + obraAcumulada
entradaTotal    = entradaDoAto + (parcelasEntrada - 1) × parcelaEntrada
mensalSobreposta= parcelaEntrada + mensal        // meses 2 a 6
mesesAteEntrega = meses de mesEfetivo até entrega
rendaSugerida   = (mensal + anual / 12) / 0.30
valoresVencidos = hoje > validoAte
```

**Invariante que os testes travam:**
`entradaTotal + mensaisRestantes × mensal + anuaisRestantes × anual === total`

A primeira anual (jul/2026) já está dentro de `entrada`, por isso não entra em
`anuaisRestantes` — o teste garante que ela não seja contada duas vezes.

---

## Especificação de exibição

Abas: **Studio 43,87m²** (padrão) e **Apto 61,42m²**. Troca sem recarregar.

```
LANÇAMENTO · OBRA A PREÇO DE CUSTO
Massaguaçu · Caraguatatuba/SP — 1 vaga + hobby box

[ Studio 43,87m² ]  Apto 61,42m²

┌ ENTRADA — diluída em 6x ─────────────────────────┐
│ Entrada do ato                      R$ 35.606    │  ← derivado
│   1/6 da entrada + 8 mensais de obra já vencidas │  ← "8" derivado
│ Mais 5 parcelas mensais de          R$ 14.166    │
│ ─────────────────────────────────────────────    │
│ Total da entrada                    R$ 106.440   │  ← derivado
└──────────────────────────────────────────────────┘

┌ OBRA — set/2026 a dez/2029 ──────────────────────┐
│ 40 parcelas mensais de              R$ 2.680     │  ← "40" derivado
│ 3 parcelas anuais, sempre em julho  R$ 15.000    │  ← "3" derivado
│ ⚠ Nos meses 2 a 6 as duas coincidem: R$ 16.846/mês│
└──────────────────────────────────────────────────┘

Valor total do studio                  R$ 258.641

✓ Sem saldo bancário no final
✓ Sem parcela na entrega das chaves
✓ As parcelas quitam 100% do imóvel

Entrega prevista      jul/2030 · faltam 47 meses    ← derivado

Renda familiar sugerida a partir do 7º mês: R$ 13.100/mês
(pode somar a renda do casal)

Valores de agosto/2026, corrigidos mensalmente pelo INCC.
Não aceita FGTS e não há financiamento bancário.
```

**Tarja após `validoAte`** (valores continuam visíveis):
> Valores de referência de agosto/2026. Podem ter sido corrigidos pelo INCC —
> confirme as condições atualizadas no WhatsApp.

**CTA do bloco** herda `data-perfil` e `data-unidade` da tipologia selecionada,
pré-preenchendo o formulário.

**Acessibilidade:** abas com `role="tablist"`/`role="tab"`/`aria-selected`,
navegáveis por seta. Com `prefers-reduced-motion` as abas continuam funcionais —
são conteúdo, não decoração. Contraste AA obrigatório (o token `--terra` já foi
ajustado para `#b25f2c`).

---

## Casos de borda

| Situação | Comportamento |
|---|---|
| Todas as 48 mensais vencidas (após dez/2029) | `mensaisRestantes = 0`; bloco de obra some; nada negativo |
| Data depois da entrega | `mesesAteEntrega = 0`, texto vira "Entrega prevista para jul/2030" |
| `mensaisVencidas` maior que `totalMensais` | limitado por `clamp` |
| Dia 25 em mês de 28/30/31 dias | virada é por número do dia, não fração do mês |
| Virada de ano (dez → jan) | aritmética em meses absolutos, não subtração de campos |
| JS desabilitado | HTML entrega a tipologia padrão (studio) já renderizada no servidor |

---

## Testes

`scripts/test-precos.mjs` — roda no build, sem navegador.

1. **Fechamento das duas tipologias:** o invariante acima, com tolerância de R$ 0,10.
2. **Conferência contra o espelho:** `48 × mensal + 4 × anual === area × 4300`.
3. **Virada do dia 25:** dias 24 e 25 do mesmo mês produzem contagens diferentes;
   dias 25 e 26 produzem a mesma.
4. **Linha do tempo:** em 2026-01 → 1 vencida / 47 restantes; em 2029-12 → 48 e 0;
   em 2030-01 → 48 e 0 (não passa de 48).
5. **Primeira anual não contada duas vezes:** em qualquer data após jul/2026,
   `anuaisRestantes ≤ 3`.
6. **Tarja de vigência:** aparece depois de `validoAte`, não antes.

Este é o único ponto da página onde um erro publica **preço errado** em vez de
desalinhamento visual — por isso os testes travam as contas, não a aparência.

---

## Fora de escopo

- Variação de preço por andar (a página comunica "a partir de")
- Simulador de renda com entrada livre do visitante — a renda sugerida é exibida
  como número fixo derivado, sem input
- Integração com o espelho em PDF (atualização continua manual, por config)
- Exibição das unidades disponíveis em tempo real
