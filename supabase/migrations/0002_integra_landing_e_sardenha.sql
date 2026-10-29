-- =====================================================================
-- TH Imóveis · CRM · migração 0002
-- Liga as tabelas já existentes da landing (projetos, leads) ao CRM,
-- libera o acesso do Thiago e cadastra o Residencial Sardenha.
-- Não altera nem apaga nada que já existia.
-- =====================================================================

-- 0) Aviso do Supabase: is_equipe() não precisa ser chamável sem login
revoke execute on function public.is_equipe() from public, anon;
grant execute on function public.is_equipe() to authenticated;

-- 1) Projeto da landing aponta para o empreendimento do CRM
alter table public.projetos
  add column if not exists empreendimento_id uuid references public.empreendimentos(id) on delete set null;
create index if not exists projetos_empreendimento_id_idx on public.projetos (empreendimento_id);

-- 2) Lead da landing vira cliente + negócio no CRM, automaticamente
create or replace function public.lead_landing_para_crm()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_cliente uuid;
  v_emp uuid;
  v_obj public.objetivo_cliente;
  v_tel text := regexp_replace(new.whatsapp, '\D', '', 'g');
begin
  v_obj := case
    when new.objetivo ilike '%airbnb%' or new.objetivo ilike '%temporada%' then 'airbnb'
    when new.objetivo ilike '%invest%' then 'investir'
    when new.objetivo ilike '%primeiro%' then 'primeiro_imovel'
    when new.objetivo ilike '%morar%' then 'morar'
    else null end::public.objetivo_cliente;

  select empreendimento_id into v_emp from public.projetos where slug = new.projeto;

  select id into v_cliente from public.clientes
   where regexp_replace(telefone, '\D', '', 'g') = v_tel
   limit 1;

  if v_cliente is null then
    insert into public.clientes (nome, telefone, origem, objetivo, finalidade, consentimento_em, consentimento_canal, observacoes)
    values (new.nome, v_tel, 'site', v_obj, 'lancamento', now(), 'site:' || new.projeto,
            concat_ws(' | ', 'Landing: ' || new.projeto, 'Objetivo informado: ' || new.objetivo,
                      'Unidade: ' || new.unidade, 'Andar: ' || new.andar, 'UTM: ' || new.utm_source || '/' || new.utm_campaign))
    returning id into v_cliente;
  end if;

  insert into public.negocios (cliente_id, empreendimento_id, etapa)
  values (v_cliente, v_emp, 'lead');

  insert into public.agentes_log (agente, acao, motivo, entidade, entidade_id, dados)
  values ('sistema', 'lead_landing_importado', 'Formulário da landing ' || new.projeto, 'clientes', v_cliente,
          jsonb_build_object('lead_id', new.id, 'pagina', new.pagina));
  return new;
end $$;

revoke execute on function public.lead_landing_para_crm() from public, anon, authenticated;

drop trigger if exists t_lead_landing_para_crm on public.leads;
create trigger t_lead_landing_para_crm after insert on public.leads
  for each row execute function public.lead_landing_para_crm();

-- 3) Thiago (equipe) vê e edita projetos e leads da landing; o acesso público da landing continua igual
create policy equipe_total on public.projetos for all to authenticated
  using ((select public.is_equipe())) with check ((select public.is_equipe()));
create policy equipe_total on public.leads for all to authenticated
  using ((select public.is_equipe())) with check ((select public.is_equipe()));

-- 4) O primeiro login com o e-mail do Thiago entra automaticamente na equipe
create or replace function public.auto_equipe_thiago()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if lower(new.email) = 'thbrokerln@gmail.com' then
    insert into public.equipe (user_id, nome, papel) values (new.id, 'Thiago Araújo de Oliveira', 'admin')
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.auto_equipe_thiago() from public, anon, authenticated;

drop trigger if exists t_auto_equipe_thiago on auth.users;
create trigger t_auto_equipe_thiago after insert on auth.users
  for each row execute function public.auto_equipe_thiago();

-- 5) Residencial Sardenha (Lollo Ganassali em parceria com Campana) · Massaguaçu
with emp as (
  insert into public.empreendimentos (construtora_id, nome, categoria, tipo, bairro, status_obra, descricao, origem_importacao)
  select c.id, 'Residencial Sardenha', 'lancamento', 'misto', 'Massaguaçu', 'em_obra',
         'Lançamento Lollo Ganassali em parceria com a Campana. Studios de 43 m² e apartamentos de 2 suítes com 61 m², vendidos a preço de obra. Públicos: investidor (temporada e valorização) e primeiro imóvel. Tabela, renders e plantas a anexar.',
         'conversas anteriores com o Thiago'
  from public.construtoras c where c.nome = 'Lollo Ganassali'
  returning id
)
insert into public.tipologias (empreendimento_id, nome, area_m2, suites)
select id, t.nome, t.area, t.suites from emp,
  (values ('Studio', 43::numeric, 0), ('2 suítes', 61::numeric, 2)) as t(nome, area, suites);
