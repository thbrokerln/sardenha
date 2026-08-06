-- ===========================================================================
-- Base de leads compartilhada por varias landings de lancamento imobiliario.
--
-- Desenho: uma tabela `leads` para todos os projetos, separada pela coluna
-- `projeto`, que e chave estrangeira para `projetos`. Assim uma landing nova
-- so precisa de uma linha em `projetos` — e um slug digitado errado quebra na
-- hora, em vez de virar lead orfao que ninguem acha depois.
--
-- Seguranca: o formulario roda no navegador, entao a chave `anon` e publica.
-- Ela pode APENAS inserir. Nao pode ler, editar nem apagar lead nenhum.
-- ===========================================================================

-- ---------------------------------------------------------------- projetos
create table if not exists public.projetos (
  slug        text primary key,
  nome        text        not null,
  ativo       boolean     not null default true,
  criado_em   timestamptz not null default now()
);

comment on table  public.projetos is 'Cada landing de lancamento. O slug e o que a landing envia.';
comment on column public.projetos.ativo is 'false = para de aceitar lead novo, sem apagar o historico.';

-- ------------------------------------------------------------------- leads
create table if not exists public.leads (
  id            uuid        primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),

  projeto       text        not null references public.projetos(slug),

  -- o que a pessoa preencheu
  nome          text        not null,
  whatsapp      text        not null,
  objetivo      text,
  unidade       text,

  -- de onde ela veio (preenchido automatico pela landing)
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  fbclid        text,
  gclid         text,
  pagina        text,

  -- uso interno do time de vendas
  status        text        not null default 'novo',
  observacoes   text,

  constraint leads_nome_valido     check (char_length(nome) between 2 and 120),
  constraint leads_whatsapp_valido check (char_length(whatsapp) between 10 and 20),
  constraint leads_status_valido   check (status in ('novo','contatado','qualificado','visita','proposta','fechado','perdido'))
);

comment on column public.leads.status is 'Funil de vendas. Comeca em novo; o time atualiza pelo painel.';

-- consulta mais comum: os leads de um projeto, mais recentes primeiro
create index if not exists leads_projeto_data_idx on public.leads (projeto, criado_em desc);
create index if not exists leads_status_idx       on public.leads (projeto, status);

-- ------------------------------------------------------------------ RLS
alter table public.projetos enable row level security;
alter table public.leads    enable row level security;

-- a landing precisa enxergar os projetos ativos para a FK bater.
-- Slug de projeto nao e segredo — ele ja vai no HTML da pagina.
drop policy if exists "anon le projetos ativos" on public.projetos;
create policy "anon le projetos ativos"
  on public.projetos for select
  to anon
  using (ativo);

-- inserir e a UNICA coisa que a chave publica pode fazer.
-- A validacao de tamanho tambem esta aqui para o caso de alguem postar
-- direto na API, sem passar pelo formulario.
drop policy if exists "anon insere lead" on public.leads;
create policy "anon insere lead"
  on public.leads for insert
  to anon
  with check (
    char_length(nome) between 2 and 120
    and char_length(whatsapp) between 10 and 20
    and status = 'novo'
    and exists (select 1 from public.projetos p where p.slug = projeto and p.ativo)
  );

-- Sem policy de select/update/delete para anon = ninguem le os leads com a
-- chave publica. Defesa em profundidade: tira o privilegio tambem.
revoke select, update, delete on public.leads from anon;

-- ------------------------------------------------------- projetos iniciais
insert into public.projetos (slug, nome) values
  ('sardenha', 'Residencial Sardenha — Massaguaçu, Caraguatatuba')
on conflict (slug) do nothing;
