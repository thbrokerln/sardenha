-- =====================================================================
-- TH Imóveis · CRM · migração 0001 (estrutura base)
-- Supabase / Postgres 17 · região sa-east-1
-- =====================================================================

-- ---------- Tipos ----------
create type public.finalidade as enum ('venda', 'locacao', 'temporada', 'lancamento');
create type public.origem_lead as enum ('whatsapp', 'instagram', 'site', 'indicacao', 'placa', 'parceiro', 'outro');
create type public.objetivo_cliente as enum ('morar', 'investir', 'airbnb', 'segundo_imovel', 'primeiro_imovel', 'outro');
create type public.etapa_negocio as enum ('lead', 'qualificado', 'visita_agendada', 'visita_realizada', 'proposta', 'negociacao', 'documentacao', 'fechado', 'perdido');
create type public.tipo_fechamento as enum ('escritura', 'financiamento', 'permuta', 'contrato_locacao');
create type public.temperatura as enum ('frio', 'morno', 'quente');
create type public.status_decisao as enum ('pendente', 'aprovada', 'ajustada', 'recusada', 'expirada');

-- ---------- Equipe e permissão ----------
create table public.equipe (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'admin',
  criado_em timestamptz not null default now()
);

create or replace function public.is_equipe()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.equipe where user_id = (select auth.uid())) $$;

create or replace function public.set_atualizado_em()
returns trigger language plpgsql set search_path = ''
as $$ begin new.atualizado_em = now(); return new; end $$;

-- ---------- Construtoras e lançamentos ----------
create table public.construtoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  contato text, telefone text, email text, site text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.empreendimentos (
  id uuid primary key default gen_random_uuid(),
  construtora_id uuid references public.construtoras(id) on delete set null,
  nome text not null,
  categoria text not null default 'lancamento',      -- lancamento | pronto | loteamento
  tipo text,                                           -- studio | apartamento | casa | misto | lote
  bairro text,
  cidade text not null default 'Caraguatatuba',
  endereco text,
  status_obra text default 'em_obra',                  -- na_planta | em_obra | pronto
  previsao_entrega date,
  preco_min numeric(14,2), preco_max numeric(14,2),
  descricao text,
  materiais jsonb not null default '[]'::jsonb,        -- [{tipo:'render'|'planta'|'tabela'|'book', url, nome}]
  drive_url text,
  site_slug text unique,
  ativo boolean not null default true,
  origem_importacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.tipologias (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  nome text not null,
  area_m2 numeric(8,2), quartos int, suites int, vagas int,
  preco_a_partir numeric(14,2),
  unidades_disponiveis int,
  criado_em timestamptz not null default now()
);

-- ---------- Proprietários e imóveis ----------
create table public.proprietarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text, email text,
  observacoes text,
  ultima_avaliacao date,
  proxima_reavaliacao date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  finalidade public.finalidade not null,
  tipo text not null,                                  -- casa | apartamento | studio | terreno | comercial
  titulo text,
  endereco text, bairro text not null,
  cidade text not null default 'Caraguatatuba',
  area_m2 numeric(8,2), quartos int, suites int, vagas int,
  preco numeric(14,2) not null,
  condominio numeric(10,2), iptu numeric(10,2),
  matricula text,
  proprietario_id uuid references public.proprietarios(id) on delete set null,
  empreendimento_id uuid references public.empreendimentos(id) on delete set null,
  autorizacao_venda boolean not null default false,
  exclusividade boolean not null default false,
  exclusividade_ate date,
  comissao_pct numeric(5,2) default 6,
  fotos jsonb not null default '[]'::jsonb,
  videos jsonb not null default '[]'::jsonb,
  status text not null default 'ativo',                -- ativo | reservado | vendido | locado | inativo
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Clientes ----------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  instagram text,
  origem public.origem_lead not null,
  objetivo public.objetivo_cliente,
  finalidade public.finalidade,
  faixa_renda text,                                    -- faixa visível aos agentes, ex.: '15-25k'
  usa_fgts boolean,
  forma_pagamento text,                                -- a_vista | financiamento | permuta | misto
  preco_min numeric(14,2), preco_max numeric(14,2),
  bairros text[] not null default '{}',
  quartos_min int,
  credibilidade text,                                  -- boa | regular | atencao
  temperatura public.temperatura not null default 'morno',
  consentimento_em timestamptz,
  consentimento_canal text,
  opt_out boolean not null default false,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Dados sensíveis: separados, sem acesso dos agentes (service_role revogado abaixo)
create table public.clientes_sensivel (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  cpf text,
  renda_mensal numeric(14,2),
  observacoes_privadas text,
  atualizado_em timestamptz not null default now()
);

-- ---------- Parceiros (corretores) ----------
create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  creci text, telefone text, email text,
  split_padrao_pct numeric(5,2) not null default 50,
  criado_em timestamptz not null default now()
);

-- ---------- Negócios, visitas, propostas ----------
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  imovel_id uuid references public.imoveis(id) on delete set null,
  empreendimento_id uuid references public.empreendimentos(id) on delete set null,
  tipologia_id uuid references public.tipologias(id) on delete set null,
  etapa public.etapa_negocio not null default 'lead',
  valor numeric(14,2),
  tipo_fechamento public.tipo_fechamento,
  parceiro_id uuid references public.parceiros(id) on delete set null,
  split_parceiro_pct numeric(5,2),
  comissao_pct numeric(5,2),
  motivo_perda text,
  fechado_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perda_tem_motivo check (etapa <> 'perdido' or motivo_perda is not null)
);

create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references public.negocios(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  imovel_id uuid references public.imoveis(id) on delete set null,
  empreendimento_id uuid references public.empreendimentos(id) on delete set null,
  inicio timestamptz not null,
  status text not null default 'agendada',             -- agendada | realizada | cancelada | nao_compareceu
  resultado text,
  google_event_id text,
  criado_em timestamptz not null default now()
);

create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  valor numeric(14,2) not null,
  condicoes text,
  autor text not null default 'cliente',               -- cliente | proprietario | construtora
  status text not null default 'aberta',               -- aberta | aceita | recusada | contraproposta
  proposta_anterior_id uuid references public.propostas(id),
  criado_em timestamptz not null default now()
);

-- ---------- Documentos (arquivos no bucket privado 'documentos') ----------
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references public.negocios(id) on delete cascade,
  imovel_id uuid references public.imoveis(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo text not null,                                  -- autorizacao_venda | exclusividade | proposta | matricula | iptu | rg_cpf | certidao | contrato
  pessoal boolean not null default false,              -- true = documento pessoal, nunca lido por agentes
  storage_path text,
  status text not null default 'pendente',             -- pendente | recebido | aprovado | enviado_assinatura | assinado
  zapsign_doc_id text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Comissões ----------
create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  valor_bruto numeric(14,2) not null,
  valor_parceiro numeric(14,2) not null default 0,
  valor_liquido numeric(14,2) generated always as (valor_bruto - valor_parceiro) stored,
  previsao date,
  recebido_em date,
  status text not null default 'prevista',             -- prevista | recebida | atrasada
  criado_em timestamptz not null default now()
);

-- ---------- Conversas ----------
create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  canal public.origem_lead not null,
  direcao text not null,                               -- entrada | saida
  autor text not null,                                 -- cliente | thiago | agente_sdr | agente_followup | agente_posvenda
  texto text,
  status text not null default 'enviada',              -- rascunho | aguardando_aprovacao | enviada | falhou
  externo_id text,
  criado_em timestamptz not null default now()
);

-- ---------- Match imóvel x lead ----------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  imovel_id uuid references public.imoveis(id) on delete cascade,
  tipologia_id uuid references public.tipologias(id) on delete cascade,
  score int not null,
  status text not null default 'sugerido',             -- sugerido | aprovado | enviado | descartado
  criado_em timestamptz not null default now(),
  unique (cliente_id, imovel_id, tipologia_id)
);

-- ---------- Conteúdo ----------
create table public.conteudos (
  id uuid primary key default gen_random_uuid(),
  publico text,                                        -- investidor_airbnb | segundo_imovel | empresario | primeiro_imovel
  formato text not null default 'reel',
  tema text, roteiro text, legenda text,
  imovel_id uuid references public.imoveis(id) on delete set null,
  empreendimento_id uuid references public.empreendimentos(id) on delete set null,
  data_publicacao date,
  status text not null default 'rascunho',             -- rascunho | aguardando_aprovacao | aprovado | publicado | recusado
  criado_em timestamptz not null default now()
);

-- ---------- Agentes e CEO ----------
create table public.agentes_log (
  id bigint generated always as identity primary key,
  agente text not null,
  acao text not null,
  motivo text,
  entidade text, entidade_id uuid,
  dados jsonb,
  criado_em timestamptz not null default now()
);

create table public.decisoes_ceo (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,                                  -- proposta | preco | lead_quente | conteudo | verba | documento | match
  urgente boolean not null default false,
  contexto text not null,
  opcoes jsonb not null default '[]'::jsonb,           -- [{id:'A', texto:'...'}]
  recomendacao text,
  status public.status_decisao not null default 'pendente',
  resposta text,
  entidade text, entidade_id uuid,
  telegram_message_id bigint,
  lembrete_enviado boolean not null default false,
  criado_em timestamptz not null default now(),
  respondido_em timestamptz
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  responsavel text not null default 'thiago',          -- thiago | nome do agente
  vence_em timestamptz,
  entidade text, entidade_id uuid,
  concluida boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------- Índices ----------
create index on public.empreendimentos (construtora_id);
create index on public.tipologias (empreendimento_id);
create index on public.imoveis (finalidade, bairro, preco);
create index on public.imoveis (proprietario_id);
create index on public.imoveis (empreendimento_id);
create index on public.clientes (telefone);
create index on public.negocios (etapa);
create index on public.negocios (cliente_id);
create index on public.negocios (imovel_id);
create index on public.negocios (empreendimento_id);
create index on public.negocios (tipologia_id);
create index on public.negocios (parceiro_id);
create index on public.visitas (inicio);
create index on public.visitas (cliente_id);
create index on public.visitas (negocio_id);
create index on public.visitas (imovel_id);
create index on public.visitas (empreendimento_id);
create index on public.propostas (negocio_id);
create index on public.propostas (proposta_anterior_id);
create index on public.documentos (negocio_id);
create index on public.documentos (imovel_id);
create index on public.documentos (cliente_id);
create index on public.comissoes (negocio_id);
create index on public.mensagens (cliente_id, criado_em desc);
create index on public.matches (imovel_id);
create index on public.matches (tipologia_id);
create index on public.conteudos (imovel_id);
create index on public.conteudos (empreendimento_id);
create index on public.decisoes_ceo (status, criado_em desc);

-- ---------- Gatilhos de atualizado_em ----------
create trigger t_construtoras before update on public.construtoras for each row execute function public.set_atualizado_em();
create trigger t_empreendimentos before update on public.empreendimentos for each row execute function public.set_atualizado_em();
create trigger t_proprietarios before update on public.proprietarios for each row execute function public.set_atualizado_em();
create trigger t_imoveis before update on public.imoveis for each row execute function public.set_atualizado_em();
create trigger t_clientes before update on public.clientes for each row execute function public.set_atualizado_em();
create trigger t_clientes_sensivel before update on public.clientes_sensivel for each row execute function public.set_atualizado_em();
create trigger t_negocios before update on public.negocios for each row execute function public.set_atualizado_em();
create trigger t_documentos before update on public.documentos for each row execute function public.set_atualizado_em();

-- ---------- RLS: só a equipe autenticada ----------
do $$
declare t text;
begin
  foreach t in array array['equipe','construtoras','empreendimentos','tipologias','proprietarios','imoveis','clientes',
    'clientes_sensivel','parceiros','negocios','visitas','propostas','documentos','comissoes','mensagens','matches',
    'conteudos','agentes_log','decisoes_ceo','tarefas']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy equipe_total on public.%I for all to authenticated using ((select public.is_equipe())) with check ((select public.is_equipe()))', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Agentes (service_role) nunca leem dados sensíveis
revoke all on public.clientes_sensivel from service_role;

-- ---------- Bucket privado de documentos ----------
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('midia', 'midia', false)
on conflict (id) do nothing;

create policy documentos_equipe on storage.objects for all to authenticated
  using (bucket_id = 'documentos' and (select public.is_equipe()))
  with check (bucket_id = 'documentos' and (select public.is_equipe()));
create policy midia_equipe on storage.objects for all to authenticated
  using (bucket_id = 'midia' and (select public.is_equipe()))
  with check (bucket_id = 'midia' and (select public.is_equipe()));

-- ---------- Visão segura para agentes (sem pessoais) ----------
create view public.v_documentos_status with (security_invoker = true) as
  select id, negocio_id, imovel_id, cliente_id, tipo, status, atualizado_em
  from public.documentos;

-- ---------- Construtoras iniciais ----------
insert into public.construtoras (nome) values ('Lollo Ganassali'), ('Campana'), ('Elevate')
on conflict (nome) do nothing;
